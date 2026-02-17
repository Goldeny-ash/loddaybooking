import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Staff from "@/lib/models/Staff";
import Service from "@/lib/models/Service";

/* ---------------- Date Helpers ---------------- */

function getRange(range: string) {
  const now = new Date();

  let start: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (range) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(start);
      break;

    case "week":
      start = new Date();
      start.setDate(start.getDate() - 7);
      prevEnd = new Date(start);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      break;

    case "month":
      start = new Date();
      start.setMonth(start.getMonth() - 1);
      prevEnd = new Date(start);
      prevStart = new Date(start);
      prevStart.setMonth(prevStart.getMonth() - 1);
      break;

    default:
      start = new Date("2020-01-01");
      prevStart = new Date("2019-01-01");
      prevEnd = start;
  }

  return { start, prevStart, prevEnd };
}

/* ---------------- GET ---------------- */

export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(req.url);

  const businessId = searchParams.get("businessId");
  const range = searchParams.get("range") || "month";

  if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
    return Response.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const { start, prevStart, prevEnd } = getRange(range);

  /* ---------------- Fetch core datasets ---------------- */

  const baseQuery = {
    businessId,
    createdAt: { $gte: start },
  };

  const prevQuery = {
    businessId,
    createdAt: { $gte: prevStart, $lt: prevEnd },
  };

  const [
    bookings,
    prevBookings,
    staffCount,
    servicesCount,
    business,
  ] = await Promise.all([
    Booking.find(baseQuery).lean(),
    Booking.find(prevQuery).lean(),
    Staff.countDocuments({ businessId }),
    Service.countDocuments({ businessId, hidden: false }),
    Business.findById(businessId).lean(),
  ]);

  /* ---------------- Metrics ---------------- */

  const totalBookings = bookings.length;

  const confirmed = bookings.filter(
    (b) => b.status === "confirmed"
  );

  const prevConfirmed = prevBookings.filter(
    (b) => b.status === "confirmed"
  );

  const noShows = bookings.filter(
    (b) => b.status === "cancelled"
  ).length;

  const noShowRate = totalBookings
    ? Math.round((noShows / totalBookings) * 100)
    : 0;

  /* ---------------- Revenue + Deposits ---------------- */

  let revenue = 0;
let depositsHeld = 0;

confirmed.forEach(b => {
  // Revenue includes service price + callout fee
  revenue += (b.serviceId?.price || 0) + (b.calloutFee || 0);

  // Deposits held only if depositPolicy applies and not yet paid out
  if (b.depositAmount && !b.depositPaidOut && !b.depositRefunded) {
    depositsHeld += b.depositAmount;
  }
});


  // Join service prices
  const serviceIds = confirmed.map((b) => b.serviceId);

  const services = await Service.find({
    _id: { $in: serviceIds },
  }).lean();

  const serviceMap = new Map(
    services.map((s) => [String(s._id), s])
  );

  confirmed.forEach((b) => {
    const service = serviceMap.get(String(b.serviceId));
    if (!service) return;

    revenue += service.price || 0;
  });

  const prevRevenue = prevConfirmed.reduce((sum, b) => {
    const s = serviceMap.get(String(b.serviceId));
    return sum + (s?.price || 0);
  }, 0);

  /* ---------------- Trends ---------------- */

  const pct = (cur: number, prev: number) => {
    if (!prev) return 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const trends = {
    bookings: pct(totalBookings, prevBookings.length),
    revenue: pct(revenue, prevRevenue),
    noShows: pct(noShowRate, 0),
  };

  /* ---------------- Response ---------------- */

  return Response.json({
    bookings: totalBookings,
    revenue,
    noShows: noShowRate,
    depositsHeld,
    staff: staffCount,
    services: servicesCount,

    trends,
  });
}
