import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Deposit from "@/lib/models/Deposit";
import Booking from "@/lib/models/Booking";
import Wallet from "@/lib/models/Wallet";
import WalletTransaction from "@/lib/models/WalletTransaction";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import Business from "@/lib/models/Business";

export async function GET(req: Request) {
  console.log("🔵 Deposit Status Check Triggered");

  try {
    await connectDB();
    console.log("✅ Database connected");

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }

    const deposit = await Deposit.findOne({
      externalReference: token,
    });

    if (!deposit) {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      );
    }

    console.log("🔎 Deposit found:", deposit._id);
    console.log("📊 Current status:", deposit.status);

    // If already paid and credited — exit safely
    if (deposit.status === "PAID" && deposit.walletCredited) {
      console.log("✅ Already processed and credited");
      return NextResponse.json({ status: "PAID" });
    }

    if (!deposit.invoiceId) {
      console.log("🚨 Missing invoiceId");
      return NextResponse.json(
        { error: "Invoice ID missing" },
        { status: 500 }
      );
    }

    // --------------------------------------
    // CALL INTASEND STATUS
    // --------------------------------------

    console.log("📡 Calling IntaSend status API...");

    const response = await fetch(
      "https://api.intasend.com/api/v1/payment/status/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        },
        body: JSON.stringify({
          invoice_id: deposit.invoiceId,
        }),
      }
    );

    const data = await response.json();
    console.log("📡 IntaSend response:", data);

    const invoice = data?.invoice;
    const state = invoice?.state;

    if (!state) {
      console.log("⚠️ No state returned");
      return NextResponse.json({ status: "PENDING" });
    }

    deposit.providerState = state;
    await deposit.save();

    // --------------------------------------
    // SUCCESS
    // --------------------------------------

    if (state === "COMPLETE" || state === "SUCCESS") {
      console.log("💰 Payment SUCCESS");

      // 🔒 Idempotency guard
      if (deposit.walletCredited) {
        console.log("⚠️ Wallet already credited previously");
        return NextResponse.json({ status: "PAID" });
      }

      const wallet = await Wallet.findOne({
        businessId: deposit.businessId,
      });

      if (!wallet) {
        return NextResponse.json(
          { error: "Wallet not found" },
          { status: 500 }
        );
      }

      const gross = Number(invoice.value || 0);
      const fee = Number(invoice.charges || 0);
      const net = Number(invoice.net_amount || gross - fee);

      const previousBalance = wallet.currentBalance;
      const previousAvailableBalance = wallet.availableBalance;

      // 🔁 Update wallet balances
      wallet.currentBalance += net;
      wallet.availableBalance += net;
      await wallet.save();

      console.log("💾 Wallet credited:", net);

      // 🧾 Create wallet ledger entry
      const walletTxn = await WalletTransaction.create({
        walletId: wallet.walletId,
        businessId: deposit.businessId,
        bookingId: deposit.bookingId,

        type: "DEPOSIT",
        direction: "CREDIT",

        amount: gross,
        fee,
        netAmount: net,
        currency: invoice.currency || "KES",

        previousBalance,
        newBalance: wallet.currentBalance,
        previousAvailableBalance,
        newAvailableBalance: wallet.availableBalance,

        invoiceId: deposit.invoiceId,
        externalReference: deposit.externalReference,

        narrative: "Booking deposit via STK Push",
        status: "SUCCESS",
        metadata: data,
      });

      // --------------------------------------
      // UPDATE DEPOSIT
      // --------------------------------------

      deposit.status = "PAID";
      deposit.grossAmount = gross;
      deposit.feeAmount = fee;
      deposit.netAmount = net;
      deposit.walletCredited = true;
      deposit.walletTransactionId = walletTxn._id;
      deposit.mpesaReceipt = invoice.id || null;

      await deposit.save();

      console.log("✅ Deposit marked PAID");

      // --------------------------------------
      // UPDATE BOOKING
      // --------------------------------------

      const booking = await Booking.findByIdAndUpdate(
  deposit.bookingId,
  { status: "confirmed" },
  { new: true }
);

console.log("📘 Booking marked confirmed");

// 🔔 Send deposit confirmation emails
await dispatchEmailEvent("DEPOSIT_PAID", {
  business: await Business.findById(deposit.businessId),
  booking,
  calendarUrl: `https://booking.lodday.com/manage/${booking._id}?token=${booking.manageToken}`
});

return NextResponse.json({ status: "PAID" });
    }

    // --------------------------------------
    // FAILED
    // --------------------------------------

    if (state === "FAILED") {
      deposit.status = "FAILED";
      await deposit.save();

      console.log("❌ Payment failed");

      return NextResponse.json({ status: "FAILED" });
    }

    // --------------------------------------
    // STILL PROCESSING
    // --------------------------------------

    console.log("⏳ Payment still pending:", state);
    return NextResponse.json({ status: "PENDING" });

  } catch (err: any) {
    console.error("🔥 Deposit Status Error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
