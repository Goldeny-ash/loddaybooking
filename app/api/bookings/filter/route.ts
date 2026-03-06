import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import mongoose from "mongoose";

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

  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const query: Record<string, unknown> = {
    businessId: new mongoose.Types.ObjectId(businessId),
  };

  // ---- STATUS ----
  if (status) query.status = status;

  // ---- DATE EXACT ----
  if (date) {
    query.date = date;
  }

  // ---- RANGE ----
  if (range === "today") {
    const today = new Date().toISOString().slice(0, 10);
    query.date = today;
  }

  if (range === "week") {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = new Date().toISOString().slice(0, 10);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const skip = (page - 1) * pageSize;

  const bookings = await Booking.find(query)
    .populate("services.serviceId", "name price durationMinutes")
    .populate("assignedTo", "name")
    .sort({ date: -1 })
    .skip(skip)
    .limit(pageSize)
    .lean();

  const normalizedBookings = bookings.map((booking) => {
    const firstService = Array.isArray(booking?.services) ? booking.services[0] : null;
    return {
      ...booking,
      serviceId: firstService && "serviceId" in firstService ? firstService.serviceId : null,
      staffId: booking?.assignedTo || null,
    };
  });

  const total = await Booking.countDocuments(query);

  return NextResponse.json({
    bookings: normalizedBookings,
    total,
    page,
    pageSize,
  });
}
