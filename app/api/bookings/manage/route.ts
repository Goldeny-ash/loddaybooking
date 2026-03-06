import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import mongoose from "mongoose";
import Booking from "@/lib/models/Booking";
import "@/lib/models/Business";
import "@/lib/models/Service";

type BookingServiceRow = {
  serviceId?: {
    _id?: string;
    name?: string;
    callOutFee?: number;
    depositOverride?: {
      enabled?: boolean;
      type?: "percent" | "fixed";
      value?: number;
    };
  };
  price?: number;
  durationMinutes?: number;
  selectedReferenceImages?: unknown[];
  depositAmount?: number;
  calloutFee?: number;
};

type BusinessDepositPolicy = {
  enabled?: boolean;
  type?: "percent" | "fixed";
  value?: number;
};

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

  if (booking.status === "completed") {
    return NextResponse.json(
      { error: "This booking link is no longer active." },
      { status: 410 }
    );
  }

  const bookingServices = Array.isArray(booking.services) ? booking.services : [];

  // Map services to include service name and staff name
  const services = (bookingServices as BookingServiceRow[]).map((s) => ({
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

  const policyDerivedDepositAmount = bookingServices.reduce(
    (sum: number, s: BookingServiceRow) => {
      const servicePrice = Number(s.price || 0);
      const explicit = Number(s.depositAmount || 0);
      if (explicit > 0) return sum + explicit;

      const serviceOverride = s.serviceId?.depositOverride;
      if (serviceOverride?.enabled) {
        if (serviceOverride.type === "percent") {
          return sum + Math.round((servicePrice * Number(serviceOverride.value || 0)) / 100);
        }
        return sum + Number(serviceOverride.value || 0);
      }

      const businessPolicy = (booking.businessId as { depositPolicy?: BusinessDepositPolicy })?.depositPolicy;
      if (businessPolicy?.enabled) {
        if (businessPolicy.type === "percent") {
          return sum + Math.round((servicePrice * Number(businessPolicy.value || 0)) / 100);
        }
        return sum + Number(businessPolicy.value || 0);
      }

      return sum;
    },
    0
  );

  const derivedDepositAmount = services.reduce(
    (sum: number, s: { depositAmount?: number }) => sum + Number(s.depositAmount || 0),
    0
  );

  const bookingDepositAmount = Math.max(
    Number(booking.depositAmount || 0),
    derivedDepositAmount,
    policyDerivedDepositAmount
  );

  const businessRecord = booking.businessId as {
    bookingRules?: { autoApprove?: boolean };
  };
  const autoApprove = Boolean(businessRecord?.bookingRules?.autoApprove);

  // Only expose pendingDeposit for auto-approved bookings.
  // For manual approval flows, keep pending until business approves.
  const effectiveStatus =
    booking.status === "pending" && bookingDepositAmount > 0 && autoApprove
      ? "pendingDeposit"
      : booking.status;

  return NextResponse.json({
    _id: booking._id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    totalDurationMinutes: booking.totalDurationMinutes,
    grandTotal: booking.grandTotal,
    subtotal: booking.subtotal,
    calloutFee: booking.calloutFee,
    status: effectiveStatus,
    depositAmount: bookingDepositAmount,
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
