import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);

  const businessId = searchParams.get("businessId");
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const range = searchParams.get("range");

  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  const query: any = { businessId };

  // ---- STATUS ----
  if (status) query.status = status;

  // ---- DATE EXACT ----
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    query.date = { $gte: start, $lte: end };
  }

  // ---- RANGE ----
  if (range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    query.date = { $gte: start, $lte: end };
  }

  if (range === "week") {
    const start = new Date();
    start.setDate(start.getDate() - 7);

    query.date = { $gte: start };
  }

  const skip = (page - 1) * pageSize;

  const bookings = await Booking.find(query)
    .populate("serviceId", "name price durationMinutes")
    .populate("staffId", "name")
    .sort({ date: -1 })
    .skip(skip)
    .limit(pageSize)
    .lean();

  const total = await Booking.countDocuments(query);

  return NextResponse.json({
    bookings,
    total,
    page,
    pageSize,
  });
}
