import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Refund from "@/lib/models/Refund";
import Deposit from "@/lib/models/Deposit";

export async function POST(req: Request) {
  await connectDB();

  const { bookingId, token } = await req.json();

  if (!bookingId || !token) {
    return NextResponse.json({ error: "Missing bookingId or token" }, { status: 400 });
  }

  // Find the booking with the management token
  const booking = await Booking.findOne({ _id: bookingId, manageToken: token });
  if (!booking) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }

  // Only create refund if deposit exists and hasn't been refunded
  if (booking.depositAmount > 0 && !booking.depositRefunded) {
    const existingRefund = await Refund.findOne({ bookingId: booking._id });
    if (!existingRefund) {
      // Fetch deposit for this booking
      const deposit = await Deposit.findOne({ bookingId: booking._id }).sort({ createdAt: -1 });
      const refundPhoneNumber = deposit?.phoneNumber;
      if (!refundPhoneNumber) {
        return NextResponse.json({ error: "Deposit phone number not found" }, { status: 400 });
      }

      // Create refund
      await Refund.create({
        bookingId: booking._id,
        businessId: booking.businessId,
        depositId: deposit._id,
        amount: booking.depositAmount,
        phoneNumber: refundPhoneNumber,
        status: "REQUESTED",
      });
    }
  }

  // Now cancel booking
  booking.status = "cancelled";
  await booking.save();

  return NextResponse.json({ ok: true });
}
