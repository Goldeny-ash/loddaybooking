import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Deposit from "@/lib/models/Deposit";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await req.json();
    const { token } = body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findById(bookingId);

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (booking.manageToken !== token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    if (booking.status !== "confirmed")
      return NextResponse.json({ error: "Booking not eligible" }, { status: 400 });

    const deposit = await Deposit.findById(booking.depositId);

    if (!deposit || deposit.status !== "PAID")
      return NextResponse.json({ error: "Deposit not paid" }, { status: 400 });

    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
