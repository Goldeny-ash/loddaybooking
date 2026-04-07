import { NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Deposit from "@/lib/models/Deposit";
import Business from "@/lib/models/Business";
import Staff from "@/lib/models/Staff";
import { toMinutes } from "@/lib/availability/time";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { buildDashboardUrl, buildManageBookingUrl } from "@/lib/booking/utils";

const RESCHEDULE_CUTOFF_HOURS = 6;
const MAX_RESCHEDULES = 3;

type StaffDayOverride = {
  date?: string;
  closed?: boolean;
  blocks?: Array<{ start?: string; end?: string }>;
};

async function hasCapacityForSlot(params: {
  businessId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  excludeBookingId: string;
}) {
  const { businessId, serviceIds, date, startTime, endTime, excludeBookingId } = params;
  const businessObjectId = new mongoose.Types.ObjectId(businessId);
  const slotStart = toMinutes(startTime);
  const slotEnd = toMinutes(endTime);

  const staff = await Staff.find({
    businessId: businessObjectId,
    services: { $in: serviceIds },
  }).lean();

  if (!staff.length) return false;

  const weekday = new Date(date)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  let staffCapacity = 0;

  for (const member of staff) {
    const availability = member.weeklyAvailability?.[weekday];
    if (!availability?.start || !availability?.end || availability.closed) continue;

    const availabilityStart = toMinutes(availability.start);
    const availabilityEnd = toMinutes(availability.end);

    if (slotStart < availabilityStart || slotEnd > availabilityEnd) continue;

    const dayOverride = (member.availabilityOverrides || []).find(
      (override: StaffDayOverride) => override?.date === date
    ) as StaffDayOverride | undefined;

    if (dayOverride?.closed) continue;

    const overlapsBlockedRange = (dayOverride?.blocks || []).some((block) => {
      if (!block?.start || !block?.end) return false;
      const blockedStart = toMinutes(block.start);
      const blockedEnd = toMinutes(block.end);
      return slotStart < blockedEnd && blockedStart < slotEnd;
    });

    if (overlapsBlockedRange) continue;

    staffCapacity += 1;
  }

  if (staffCapacity === 0) return false;

  const bookings = await Booking.find({
    businessId: businessObjectId,
    date,
    _id: { $ne: excludeBookingId },
    status: { $in: ["confirmed", "pendingDeposit", "pending"] },
  }).lean();

  const overlappingBookings = bookings.filter((existingBooking) => {
    const bookingStart = toMinutes(existingBooking.startTime);
    const bookingEnd = toMinutes(existingBooking.endTime);
    return slotStart < bookingEnd && bookingStart < slotEnd;
  }).length;

  return overlappingBookings < staffCapacity;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      bookingId,
      token,
      newDate,
      newStartTime,
      newEndTime,
      customerName,
      customerPhone,
      customerEmail,
      note,
      customerLocation,
      calloutFee = 0,
      distanceKm,
      adminOverride = false,
    } = await req.json();

    if (!bookingId || !token || !newDate || !newStartTime || !newEndTime) {
      return NextResponse.json({ error: "Missing reschedule fields" }, { status: 400 });
    }

    const booking = await Booking.findOne({ _id: bookingId, manageToken: token });
    if (!booking) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await Business.findById(booking.businessId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    booking.rescheduleCount = booking.rescheduleCount || 0;
    if (!adminOverride && booking.rescheduleCount >= MAX_RESCHEDULES) {
      return NextResponse.json({ error: "Maximum reschedules reached" }, { status: 403 });
    }

    const now = new Date();
    const bookingTime = new Date(`${booking.date}T${booking.startTime}`);
    if (
      !adminOverride &&
      bookingTime.getTime() - now.getTime() < RESCHEDULE_CUTOFF_HOURS * 60 * 60 * 1000
    ) {
      return NextResponse.json(
        { error: `Cannot reschedule within ${RESCHEDULE_CUTOFF_HOURS} hours` },
        { status: 403 }
      );
    }

    const serviceIds = (booking.services || [])
      .map((service: any) => String(service.serviceId || ""))
      .filter(Boolean);

    if (!serviceIds.length) {
      return NextResponse.json({ error: "Booking has no services to reschedule." }, { status: 400 });
    }

    const slotStillAvailable = await hasCapacityForSlot({
      businessId: booking.businessId.toString(),
      serviceIds,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      excludeBookingId: booking._id.toString(),
    });

    if (!adminOverride && !slotStillAvailable) {
      return NextResponse.json({ error: "That slot is no longer available" }, { status: 409 });
    }

    const servicesTotal = (booking.services || []).reduce(
      (sum: number, service: any) => sum + Number(service.price || 0),
      0
    );
    const updatedCalloutFee = Math.max(0, Number(calloutFee || 0));
    const updatedGrandTotal = servicesTotal + updatedCalloutFee;

    let depositAmount = (booking.services || []).reduce(
      (sum: number, service: any) => sum + Number(service.depositAmount || 0),
      0
    );

    if (business.depositPolicy?.enabled && business.depositPolicy?.applyToCallout && updatedCalloutFee > 0) {
      const calloutDeposit =
        business.depositPolicy.type === "percent"
          ? Math.round((updatedCalloutFee * Number(business.depositPolicy.value || 0)) / 100)
          : Number(business.depositPolicy.value || 0);
      depositAmount += Math.max(0, Math.min(calloutDeposit, updatedCalloutFee));
    }

    let depositToken: string | null = null;
    const depositRequired = depositAmount > 0;

    if (depositRequired) {
      depositToken = booking.manageToken;
      const externalReference = crypto.randomBytes(24).toString("hex");
      await Deposit.create({
        bookingId: booking._id,
        businessId: booking.businessId,
        amount: depositAmount,
        phoneNumber: customerPhone.startsWith("0") ? `254${customerPhone.slice(1)}` : customerPhone.replace("+", ""),
        externalReference,
        status: "PENDING",
      });
    }

    booking.date = newDate;
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    booking.customerName = customerName;
    booking.customerPhone = customerPhone;
    booking.customerEmail = customerEmail;
    booking.note = note;
    booking.customerLocation = customerLocation;
    booking.calloutFee = updatedCalloutFee;
    booking.distanceKm = typeof distanceKm === "number" ? distanceKm : booking.distanceKm;
    booking.grandTotal = updatedGrandTotal;
    booking.depositAmount = Math.min(depositAmount, updatedGrandTotal);
    booking.rescheduleCount += 1;
    booking.reminder24hSent = false;
    booking.reminder1hSent = false;
    booking.reminder30mSent = false;
    booking.confirmation45mBusinessSent = false;
    booking.confirmation30mBusinessSent = false;
    booking.confirmationRequestedAt = undefined;
    booking.confirmedAt = undefined;
    booking.cancelledAt = undefined;
    booking.confirmationStatus = "pending";
    booking.status =
      business.bookingRules?.autoApprove === true
        ? booking.depositAmount > 0
          ? "pendingDeposit"
          : "confirmed"
        : "pending";

    await booking.save();

    const manageUrl = buildManageBookingUrl({
      username: business.username,
      bookingId: booking._id.toString(),
      token: booking.manageToken,
    });

    await dispatchEmailEvent("BOOKING_RESCHEDULED", {
      business,
      booking,
      manageUrl,
      dashboardUrl: buildDashboardUrl(),
    });

    return NextResponse.json({
      ok: true,
      booking,
      depositRequired,
      depositToken,
    });
  } catch (err) {
    console.error("Reschedule POST error:", err);
    return NextResponse.json({ error: "Failed to reschedule booking" }, { status: 500 });
  }
}
