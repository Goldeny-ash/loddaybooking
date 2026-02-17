import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";
import { generateSlots } from "@/lib/availability/engine";
import { toMinutes, fromMinutes } from "@/lib/availability/time";

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

    const businessId = new Types.ObjectId(businessIdRaw);

    await connectDB();

    // ---------------- Load Services ----------------
    const services = await Service.find({
      _id: { $in: serviceIds },
      businessId,
    }).lean();

    if (!services.length) return NextResponse.json({ slots: [] });

    const totalDuration = services.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    // ---------------- Load Eligible Staff ----------------
    const staffMap: Record<string, any[]> = {}; // serviceId -> eligible staff
    const weekday = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    for (const svc of services) {
      const staff = await Staff.find({
        businessId,
        services: svc._id.toString(), // only staff eligible for this service
      }).lean();

      staffMap[svc._id.toString()] = staff;
    }

    if (Object.values(staffMap).some(staffs => staffs.length === 0)) {
      // No eligible staff for one of the services
      return NextResponse.json({ slots: [] });
    }

    // ---------------- Generate Base Slots ----------------
    const dayStart = "06:00";
    const dayEnd = "22:00";

    const baseSlots = generateSlots(dayStart, dayEnd, totalDuration);

    const availableSlots: { startTime: string; endTime: string }[] = [];

    // ---------------- Check Conflicts ----------------
    for (const slot of baseSlots) {
      let slotValid = true;

      for (const svc of services) {
        const svcStart = fromMinutes(toMinutes(slot.startTime));
        const svcEnd = fromMinutes(toMinutes(svcStart) + (svc.durationMinutes || 0));

        const eligibleStaff = staffMap[svc._id.toString()].filter(staff => {
          const avail = staff.weeklyAvailability?.[weekday];
          if (!avail) return false;

          const availStart = toMinutes(avail.start);
          const availEnd = toMinutes(avail.end);

          return toMinutes(svcStart) >= availStart && toMinutes(svcEnd) <= availEnd;
        });

        if (!eligibleStaff.length) {
          slotValid = false;
          break;
        }

        const conflict = await Booking.findOne({
          businessId,
          date,
          "services.serviceId": svc._id,
          startTime: { $lt: svcEnd },
          endTime: { $gt: svcStart },
          status: { $in: ["confirmed", "pendingDeposit"] },
        }).lean();

        if (conflict) {
          slotValid = false;
          break;
        }
      }

      if (slotValid) {
        availableSlots.push({ startTime: slot.startTime, endTime: slot.endTime });
      }
    }

    return NextResponse.json({ date, slots: availableSlots });
  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json({ error: "Failed to compute availability" }, { status: 500 });
  }
}
