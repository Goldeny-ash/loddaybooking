import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> } // ✅ wrap in Promise for validator
) {
  const { bookingId } = await params; // await to get real value

  await connectDB();

  const booking = await Booking.findById(bookingId)
    .populate("serviceId")
    .populate("staffId");

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
