import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingKey = searchParams.get("key");

    if (!bookingKey) {
      return NextResponse.json({ error: "Missing booking key" }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findOne({ bookingKey })
      .populate("businessId")
      .populate("services.serviceId")
      .lean();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const services = booking.services.map((s: any) => ({
      serviceName: s.serviceId?.name || "Service",
      price: s.price,
      durationMinutes: s.durationMinutes,
      selectedReferenceImages: s.selectedReferenceImages || [],
    }));

    return NextResponse.json({
      bookingKey: booking.bookingKey,
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
    console.error("Confirmation fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}
