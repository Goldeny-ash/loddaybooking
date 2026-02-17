import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await context.params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
    }

    await connectDB();

    // Populate nested services array
    const booking = await Booking.findOne({
      _id: bookingId,
      manageToken: token,
    })
      .populate("businessId")
      .populate("services.serviceId")
      
      .lean();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Map services for response
    const services = booking.services.map((s: any) => ({
      serviceName: s.serviceId?.name,
      staffName: s.staffId?.name,
      price: s.price,
      durationMinutes: s.durationMinutes,
      selectedReferenceImages: s.selectedReferenceImages || [],
    }));

    return NextResponse.json({
      _id: booking._id,
      business: {
        name: booking.businessId?.name,
        username: booking.businessId?.username,
        logo: booking.businessId?.logo,
      },
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalDurationMinutes: booking.totalDurationMinutes,
      subtotal: booking.subtotal,
      calloutFee: booking.calloutFee,
      grandTotal: booking.grandTotal,
      status: booking.status,
      note: booking.note,
      services,
    });
  } catch (err) {
    console.error("Booking fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}
