import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import mongoose from "mongoose";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!bookingId || !token)
    return NextResponse.json(
      { error: "Missing bookingId or token" },
      { status: 400 }
    );

  if (!mongoose.Types.ObjectId.isValid(bookingId))
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });

  // Find the booking and populate business and each service's info
  const booking = await Booking.findOne({ _id: bookingId, manageToken: token })
    .populate({
      path: "businessId",
      select:
        "name logo username phone access depositPolicy bookingRules workingHours location theme notificationPrefs mobileSettings",
    })
    .populate({
      path: "services.serviceId",
      select:
        "name price durationMinutes bufferMinutes staffIds depositOverride callOutFee",
    })
  
    .lean();

  if (!booking)
    return NextResponse.json({ error: "Invalid link" }, { status: 403 });

  // Map services to include service name and staff name
  const services = booking.services.map((s: any) => ({
    serviceId: s.serviceId?._id,
    serviceName: s.serviceId?.name,
    price: s.price,
    durationMinutes: s.durationMinutes,
   staffId: null, // no staff assigned
  staffName: null,
  
    selectedReferenceImages: s.selectedReferenceImages || [],
    depositAmount: s.depositAmount || 0,
    callOutFee: s.calloutFee || s.serviceId?.callOutFee || 0,
  }));

  return NextResponse.json({
    _id: booking._id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    totalDurationMinutes: booking.totalDurationMinutes,
    grandTotal: booking.grandTotal,
    subtotal: booking.subtotal,
    calloutFee: booking.calloutFee,
    status: booking.status,
    depositAmount: booking.depositAmount,
    rescheduleCount: booking.rescheduleCount,
    rejectionReason: booking.rejectionReason,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    note: booking.note,
    source: booking.source,
    business: booking.businessId,
    services,
  });
}
