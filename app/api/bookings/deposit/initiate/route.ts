import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Deposit from "@/lib/models/Deposit";
import Business from "@/lib/models/Business";
import Wallet from "@/lib/models/Wallet";
import crypto from "crypto";

export async function POST(req: Request) {
  console.log("🔵 Deposit POST route called");

  try {
    await connectDB();
    console.log("✅ Database connected");

    const { bookingId, phoneNumber, amount } = await req.json();
    console.log("📦 Request body:", { bookingId, phoneNumber, amount });

    if (!bookingId || !phoneNumber || !amount) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing bookingId, phoneNumber or amount" },
        { status: 400 }
      );
    }

    // --------------------------------------
    // FIND BOOKING
    // --------------------------------------

    const booking = await Booking.findById(bookingId);
    console.log("🔎 Booking found:", !!booking);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // --------------------------------------
    // FIND BUSINESS
    // --------------------------------------

    const business = await Business.findById(booking.businessId);
    console.log("🏢 Business found:", !!business);

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // --------------------------------------
    // RESOLVE WALLET ID (PRIMARY + FALLBACK)
    // --------------------------------------

    let walletId: string | null = null;

    // 1️⃣ First try business.wallet
    if (business.wallet?.walletId) {
      walletId = business.wallet.walletId;
      console.log("✅ Wallet found on Business document:", walletId);
    }

    // 2️⃣ Fallback to Wallet collection
    if (!walletId) {
      console.log("⚠️ Business.wallet missing. Searching Wallet collection...");

      const walletDoc = await Wallet.findOne({
        businessId: business._id,
      });

      if (walletDoc) {
        walletId = walletDoc.walletId;
        console.log("✅ Wallet found in Wallet collection:", walletId);

        // 🔧 Optional self-healing: repair Business.wallet
        business.wallet = {
          walletId: walletDoc.walletId,
          walletLabel: `BIZ_${business._id}`,
          walletCurrency: walletDoc.currency,
          canDisburse: walletDoc.canDisburse,
          walletCreatedAt: walletDoc.createdAt,
        };

        await business.save();
        console.log("🔧 Business.wallet repaired automatically");
      }
    }

    // 3️⃣ Still no wallet? Hard fail.
    if (!walletId) {
      console.log("🚨 No wallet found anywhere for business:", business._id);
      return NextResponse.json(
        { error: "Wallet not configured for this business" },
        { status: 400 }
      );
    }

    // --------------------------------------
    // PREVENT DOUBLE PAYMENT
    // --------------------------------------

    const existingDeposit = await Deposit.findOne({
      bookingId,
      status: { $in: ["PENDING", "PAID"] },
    });

    console.log("🔎 Existing deposit:", existingDeposit?.status);

    if (existingDeposit?.status === "PAID") {
      return NextResponse.json(
        { error: "Deposit already paid" },
        { status: 400 }
      );
    }

    if (existingDeposit?.status === "PENDING") {
      console.log("♻️ Returning existing pending deposit reference");
      return NextResponse.json({
        externalReference: existingDeposit.externalReference,
      });
    }

    // --------------------------------------
    // GENERATE REFERENCE
    // --------------------------------------

    const externalReference = crypto.randomBytes(16).toString("hex");
    console.log("🧾 Generated reference:", externalReference);

    console.log(
      "🔑 INTASEND_SECRET_KEY exists:",
      !!process.env.INTASEND_SECRET_KEY
    );

    // --------------------------------------
    // INTASEND STK PUSH
    // --------------------------------------

    console.log("📡 Initiating STK push with wallet:", walletId);

    const response = await fetch(
      "https://api.intasend.com/api/v1/payment/mpesa-stk-push/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          amount,
          currency: "KES",
          wallet_id: walletId,
          api_ref: externalReference,
          mobile_tarrif: "CUSTOMER-PAYS",
        }),
      }
    );

    console.log("📡 IntaSend response status:", response.status);

    const data = await response.json();
    console.log("📡 IntaSend response body:", data);

    if (!response.ok) {
      console.log("❌ STK Push failed");
      return NextResponse.json(
        { error: "STK Push failed", details: data },
        { status: 400 }
      );
    }

    console.log("✅ STK Push initiated successfully");

    const invoice = data?.invoice;

if (!invoice?.invoice_id) {
  console.log("🚨 Missing invoice_id from IntaSend response");
  return NextResponse.json(
    { error: "Invalid response from payment provider" },
    { status: 500 }
  );
}

const deposit = await Deposit.create({
  bookingId,
  businessId: booking.businessId,

  phoneNumber,
  currency: invoice.currency || "KES",

  grossAmount: Number(invoice.value || amount),
  feeAmount: 0,
  netAmount: 0,

  status: "PENDING",

  externalReference,
  invoiceId: invoice.invoice_id,       // ✅ REQUIRED
  providerInvoiceId: invoice.id || null,

  rawResponse: data,
});

    console.log("🗂 Deposit created:", deposit._id);

    booking.depositId = deposit._id;
    await booking.save();

    console.log("💾 Booking updated with depositId");

    return NextResponse.json({
      externalReference,
      mobileTariff: Number(invoice.charges || 0),
    });

  } catch (err: any) {
    console.error("🔥 SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
