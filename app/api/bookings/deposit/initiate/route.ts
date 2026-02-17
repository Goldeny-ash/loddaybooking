import { connectDB } from "@/lib/mongoDB";
import Deposit from "@/lib/models/Deposit";
import Booking from "@/lib/models/Booking";
import crypto from "crypto";

export async function POST(req: Request) {
  await connectDB();

  try {
    const { bookingId, phoneNumber, amount } = await req.json();
    if (!bookingId || !phoneNumber || !amount) {
      return Response.json({ error: "Missing parameters" }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });

    // ---------------- DEDUPLICATE DEPOSIT ----------------
    let deposit = await Deposit.findOne({
      bookingId: booking._id,
      phoneNumber,
      status: "PENDING",
    });

    if (!deposit) {
      const externalReference = crypto.randomBytes(8).toString("hex");
      deposit = await Deposit.create({
        bookingId,
        businessId: booking.businessId,
        amount,
        phoneNumber,
        externalReference,
        status: "PENDING",
      });
    } else {
      console.log("⚠️ Pending deposit already exists, returning existing deposit");
    }

    // ---------------- CALL PAYHERO ----------------
    const resp = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.PAYHERO_API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        phone_number: phoneNumber,
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference: deposit.externalReference,
        customer_name: booking.customerName,
        callback_url: `${process.env.BASE_URL}/api/bookings/deposit/callback`,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return Response.json({ error: "PayHero error", details: err }, { status: 500 });
    }

    return Response.json({ success: true, externalReference: deposit.externalReference });
  } catch (err: any) {
    console.error("Deposit initiate error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
