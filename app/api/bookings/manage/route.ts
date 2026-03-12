import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import mongoose from "mongoose";
import Booking from "@/lib/models/Booking";
import "@/lib/models/Business";
import "@/lib/models/Service";
import { computeDepositAmountForService } from "@/lib/booking/utils";

type BookingServiceRow = {
  serviceId?: {
    _id?: string;
    name?: string;
    description?: string;
    callOutFee?: number;
    priceRange?: {
      min?: number;
      max?: number;
    };
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
  selectedAddOns?: Array<{ title?: string; price?: number; durationMinutes?: number }>;
  selectedSessions?: Array<{ sessions?: number; price?: number; durationMinutes?: number }>;
  selectedAreas?: Array<{ area?: string; min?: number; max?: number; price?: number }>;
  selectedTier?: {
    label?: string;
    min?: number;
    max?: number;
    price?: number;
  } | null;
};

type DepositPolicyLike = {
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
        "name description priceRange durationMinutes bufferMinutes staffIds depositOverride callOutFee",
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
    serviceDescription: s.serviceId?.description,
    price: s.price,
    priceRange: s.serviceId?.priceRange,
    durationMinutes: s.durationMinutes,
    staffId: null, // no staff assigned
    staffName: null,
    selectedReferenceImages: s.selectedReferenceImages || [],
    depositAmount: s.depositAmount || 0,
    callOutFee: s.calloutFee || s.serviceId?.callOutFee || 0,
    selectedAddOns: s.selectedAddOns || [],
    selectedSessions: s.selectedSessions || [],
    selectedAreas: s.selectedAreas || [],
    selectedTier: s.selectedTier || null,
  }));

  const businessPolicy = (booking.businessId as {
    depositPolicy?: DepositPolicyLike;
  })?.depositPolicy;

  const bookingDepositAmount = bookingServices.reduce((sum: number, service: BookingServiceRow) => {
    const explicitDeposit = Number(service.depositAmount || 0);
    if (explicitDeposit > 0) {
      return sum + explicitDeposit;
    }

    return (
      sum +
      computeDepositAmountForService({
        servicePrice: Number(service.price || 0),
        service: service.serviceId,
        businessPolicy,
      })
    );
  }, 0);

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
