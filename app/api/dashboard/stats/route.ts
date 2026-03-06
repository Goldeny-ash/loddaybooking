import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
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
  ] = await Promise.all([
    Booking.find(baseQuery).lean(),
    Booking.find(prevQuery).lean(),
    Staff.countDocuments({ businessId }),
    Service.countDocuments({ businessId, hidden: false }),
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

  const getBookingValue = (b: {
    grandTotal?: number;
    subtotal?: number;
    calloutFee?: number;
    services?: Array<{ price?: number }>;
    serviceId?: { price?: number };
  }) => {
    if (typeof b.grandTotal === "number") return b.grandTotal;
    if (typeof b.subtotal === "number") return b.subtotal + (b.calloutFee || 0);
    if (Array.isArray(b.services) && b.services.length > 0) {
      return b.services.reduce(
        (sum: number, svc: { price?: number }) => sum + (svc.price || 0),
        0
      ) + (b.calloutFee || 0);
    }
    return (b.serviceId?.price || 0) + (b.calloutFee || 0);
  };

  const revenue = confirmed.reduce((sum, b) => sum + getBookingValue(b), 0);

  const prevRevenue = prevConfirmed.reduce(
    (sum, b) => sum + getBookingValue(b),
    0
  );

  const depositsHeld = confirmed.reduce((sum, b) => {
    if (b.depositAmount && !b.depositRefunded) return sum + b.depositAmount;
    return sum;
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
