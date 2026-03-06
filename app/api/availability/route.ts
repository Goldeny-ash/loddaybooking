import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";

import { generateSlots } from "@/lib/availability/engine";
import { toMinutes } from "@/lib/availability/time";

type StaffDayOverride = {
  date?: string;
  closed?: boolean;
  blocks?: Array<{ start?: string; end?: string }>;
};

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
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (!serviceIds.length) {
      return NextResponse.json({ slots: [] });
    }

    await connectDB();

    const businessId = new Types.ObjectId(businessIdRaw);

    // ---------- Load Services ----------
    const services = await Service.find({
      _id: { $in: serviceIds },
      businessId,
    }).lean();

    if (!services.length) {
      return NextResponse.json({ slots: [] });
    }

    const totalDuration = services.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0
    );

    // ---------- Load Eligible Staff ----------
    const staff = await Staff.find({
      businessId,
      services: { $in: serviceIds.map(id => id.toString()) },
    }).lean();

    if (!staff.length) {
      return NextResponse.json({ slots: [] });
    }

    // ---------- Load Bookings For That Day ----------
    const bookings = await Booking.find({
      businessId,
      date,
      status: { $in: ["confirmed", "pendingDeposit", "pending"] },
    }).lean();

    const weekday = new Date(date)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    // ---------- Kenya Time Handling ----------
    const todayKenya = new Date().toLocaleDateString("en-CA", {
      timeZone: "Africa/Nairobi",
    });

    const nowKenya = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Africa/Nairobi",
      })
    );

    const currentMinutes =
      nowKenya.getHours() * 60 + nowKenya.getMinutes();

    // ---------- Generate Slots ----------
    const baseSlots = generateSlots("06:00", "22:00", totalDuration);

    const availableSlots: { startTime: string; endTime: string }[] = [];

    for (const slot of baseSlots) {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);

      // Remove past time if today
      if (date === todayKenya && slotStart <= currentMinutes) {
        continue;
      }

      // ----- Capacity Calculation -----
      let staffCapacity = 0;

      for (const member of staff) {
        const avail = member.weeklyAvailability?.[weekday];
        if (!avail) continue;
        if (!avail.start || !avail.end) continue;
        if (avail.closed) continue;

        const availStart = toMinutes(avail.start);
        const availEnd = toMinutes(avail.end);

        if (slotStart < availStart || slotEnd > availEnd) continue;

        const dayOverride = (member.availabilityOverrides || []).find(
          (o: StaffDayOverride) => o?.date === date
        ) as StaffDayOverride | undefined;

        if (dayOverride?.closed) continue;

        const overlapsBlockedRange = (dayOverride?.blocks || []).some((b) => {
          if (!b?.start || !b?.end) return false;
          const blockedStart = toMinutes(b.start);
          const blockedEnd = toMinutes(b.end);
          return slotStart < blockedEnd && blockedStart < slotEnd;
        });

        if (overlapsBlockedRange) continue;

        staffCapacity++;
      }

      if (staffCapacity === 0) continue;

      // ----- Count Overlapping Bookings -----
      const overlappingBookings = bookings.filter(b => {
        const bStart = toMinutes(b.startTime);
        const bEnd = toMinutes(b.endTime);
        return slotStart < bEnd && bStart < slotEnd;
      }).length;

      const remainingCapacity = staffCapacity - overlappingBookings;

if (remainingCapacity <= 0) continue;

availableSlots.push({
  startTime: slot.startTime,
  endTime: slot.endTime,
});
    }

    return NextResponse.json({
      date,
      slots: availableSlots,
    });

  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json(
      { error: "Failed to compute availability" },
      { status: 500 }
    );
  }
}
