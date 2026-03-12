import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";

import { generateSlots } from "@/lib/availability/engine";
import { toMinutes } from "@/lib/availability/time";

export const dynamic = "force-dynamic";

type StaffDayOverride = {
  date?: string;
  closed?: boolean;
  blocks?: Array<{ start?: string; end?: string }>;
};

type TimeSlot = {
  startTime: string;
  endTime: string;
};

function getHourlySlots(slots: TimeSlot[], currentMinutes: number | null) {
  const grouped = new Map<number, TimeSlot[]>();

  for (const slot of slots) {
    const hour = Math.floor(toMinutes(slot.startTime) / 60);
    const bucket = grouped.get(hour) ?? [];
    bucket.push(slot);
    grouped.set(hour, bucket);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, bucket]) => {
      if (currentMinutes === null) {
        return bucket.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))[0];
      }

      return bucket.sort((a, b) => {
        const diffA = Math.abs(toMinutes(a.startTime) - currentMinutes);
        const diffB = Math.abs(toMinutes(b.startTime) - currentMinutes);
        if (diffA !== diffB) return diffA - diffB;
        return toMinutes(a.startTime) - toMinutes(b.startTime);
      })[0];
    })
    .filter(Boolean);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const businessIdRaw = searchParams.get("businessId");
    const date = searchParams.get("date");
    const servicesRaw = searchParams.get("services");

    if (!businessIdRaw || !date || !servicesRaw) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(businessIdRaw)) {
      return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
    }

    const serviceIds = servicesRaw
      .split(",")
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (!serviceIds.length) {
      return NextResponse.json({ slots: [] });
    }

    await connectDB();

    const businessId = new Types.ObjectId(businessIdRaw);

    const services = await Service.find({
      _id: { $in: serviceIds },
      businessId,
    }).lean();

    if (!services.length) {
      return NextResponse.json({ slots: [] });
    }

    const totalDuration = services.reduce((sum, service) => sum + (service.durationMinutes || 0), 0);

    const staff = await Staff.find({
      businessId,
      services: { $in: serviceIds.map((id) => id.toString()) },
    }).lean();

    if (!staff.length) {
      return NextResponse.json({ slots: [] });
    }

    const bookings = await Booking.find({
      businessId,
      date,
      status: { $in: ["confirmed", "pendingDeposit", "pending"] },
    }).lean();

    const weekday = new Date(date)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const todayKenya = new Date().toLocaleDateString("en-CA", {
      timeZone: "Africa/Nairobi",
    });

    const nowKenya = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Africa/Nairobi",
      })
    );

    const currentMinutes = nowKenya.getHours() * 60 + nowKenya.getMinutes();
    const baseSlots = generateSlots("06:00", "22:00", totalDuration, 15);

    const availableSlots: TimeSlot[] = [];

    for (const slot of baseSlots) {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);

      if (date === todayKenya && slotStart <= currentMinutes) {
        continue;
      }

      let staffCapacity = 0;

      for (const member of staff) {
        const availability = member.weeklyAvailability?.[weekday];
        if (!availability?.start || !availability?.end || availability.closed) {
          continue;
        }

        const availabilityStart = toMinutes(availability.start);
        const availabilityEnd = toMinutes(availability.end);

        if (slotStart < availabilityStart || slotEnd > availabilityEnd) {
          continue;
        }

        const dayOverride = (member.availabilityOverrides || []).find(
          (override: StaffDayOverride) => override?.date === date
        ) as StaffDayOverride | undefined;

        if (dayOverride?.closed) {
          continue;
        }

        const overlapsBlockedRange = (dayOverride?.blocks || []).some((block) => {
          if (!block?.start || !block?.end) return false;
          const blockedStart = toMinutes(block.start);
          const blockedEnd = toMinutes(block.end);
          return slotStart < blockedEnd && blockedStart < slotEnd;
        });

        if (overlapsBlockedRange) {
          continue;
        }

        staffCapacity += 1;
      }

      if (staffCapacity === 0) {
        continue;
      }

      const overlappingBookings = bookings.filter((booking) => {
        const bookingStart = toMinutes(booking.startTime);
        const bookingEnd = toMinutes(booking.endTime);
        return slotStart < bookingEnd && bookingStart < slotEnd;
      }).length;

      if (staffCapacity - overlappingBookings <= 0) {
        continue;
      }

      availableSlots.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }

    const currentReferenceMinutes = date === todayKenya ? currentMinutes : null;
    const slots = getHourlySlots(availableSlots, currentReferenceMinutes);

    return NextResponse.json({
      date,
      slots,
    });
  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json({ error: "Failed to compute availability" }, { status: 500 });
  }
}
