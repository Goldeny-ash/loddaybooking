import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Booking from "@/lib/models/Booking";
import Staff from "@/lib/models/Staff";
import Service from "@/lib/models/Service";
import { getBookingRevenueValue } from "@/lib/utils/bookingPresentation";

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
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);

    const businessId = searchParams.get("businessId");
    const range = searchParams.get("range") || "month";

    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
      return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
    }

    const business = await Business.findOne({
      _id: businessId,
      clerkUserId: userId,
    })
      .select({ _id: 1 })
      .lean();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const { start, prevStart, prevEnd } = getRange(range);

    const normalizedBusinessId = new mongoose.Types.ObjectId(businessId);

    /* ---------------- Fetch core datasets ---------------- */

    const baseQuery = {
      businessId: normalizedBusinessId,
      createdAt: { $gte: start },
    };

    const prevQuery = {
      businessId: normalizedBusinessId,
      createdAt: { $gte: prevStart, $lt: prevEnd },
    };

    const [bookings, prevBookings, staffCount, servicesCount] = await Promise.all([
      Booking.find(baseQuery).lean(),
      Booking.find(prevQuery).lean(),
      Staff.countDocuments({ businessId: normalizedBusinessId }),
      Service.countDocuments({ businessId: normalizedBusinessId, hidden: false }),
    ]);

    /* ---------------- Metrics ---------------- */

    const totalBookings = bookings.length;

    const revenueBookings = bookings.filter(
      (b) => b.status === "confirmed" || b.status === "completed"
    );

    const prevRevenueBookings = prevBookings.filter(
      (b) => b.status === "confirmed" || b.status === "completed"
    );

    const noShows = bookings.filter((b) => b.status === "cancelled").length;

    const noShowRate = totalBookings
      ? Math.round((noShows / totalBookings) * 100)
      : 0;

    /* ---------------- Revenue + Deposits ---------------- */

    const revenue = revenueBookings.reduce(
      (sum, b) => sum + getBookingRevenueValue(b),
      0
    );

    const prevRevenue = prevRevenueBookings.reduce(
      (sum, b) => sum + getBookingRevenueValue(b),
      0
    );

    const depositsHeld = revenueBookings.reduce((sum, b) => {
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

    return NextResponse.json({
      bookings: totalBookings,
      revenue,
      noShows: noShowRate,
      depositsHeld,
      staff: staffCount,
      services: servicesCount,
      trends,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
