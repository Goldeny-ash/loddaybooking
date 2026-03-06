import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";
import Booking from "@/lib/models/Booking";
import WalletTransaction from "@/lib/models/WalletTransaction";

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();

  const trackingId = body?.tracking_id;
  const statusCode = body?.status;

  if (!trackingId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const refund = await Refund.findOne({ trackingId });
  if (!refund) {
    return NextResponse.json({ ok: true }); // ignore unknown
  }

  // Idempotency guard
  if (refund.status === "PAID") {
    return NextResponse.json({ ok: true });
  }

  if (statusCode === "TS100") {
    // SUCCESS

    refund.status = "PAID";
    refund.paidAt = new Date();
    await refund.save();

    await Booking.findByIdAndUpdate(refund.bookingId, {
      depositRefunded: true,
      status: "refunded",
    });

    await WalletTransaction.create({
      walletId: "SETTLEMENT",
      businessId: refund.businessId,
      bookingId: refund.bookingId,
      type: "REFUND",
      direction: "DEBIT",
      amount: refund.amount,
      currency: "KES",
      status: "SUCCESS",
      trackingId,
    });
  }

  if (statusCode === "TF106") {
    refund.status = "FAILED";
    refund.failedAt = new Date();
    await refund.save();
  }

  return NextResponse.json({ ok: true });
}
