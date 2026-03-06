import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import mongoose from "mongoose";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);

  const businessId = searchParams.get("businessId");
  const status = searchParams.get("status"); // optional
  const date = searchParams.get("date"); // optional YYYY-MM-DD

  if (!businessId) {
    return Response.json(
      { error: "businessId is required" },
      { status: 400 }
    );
  }

  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    return Response.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const query: Record<string, unknown> = {
    businessId: new mongoose.Types.ObjectId(businessId),
  };

  if (status) {
    query.status = status;
  }

  if (date) {
    query.date = date;
  }

  const bookings = await Booking.find(query)
    .populate("services.serviceId", "name durationMinutes")
    .populate("assignedTo", "name")
    .sort({ createdAt: -1 })
    .limit(100);

  const normalized = bookings.map((booking) => {
    const firstService = Array.isArray(booking?.services) ? booking.services[0] : null;
    return {
      ...booking.toObject(),
      serviceId: firstService && "serviceId" in firstService ? firstService.serviceId : null,
      staffId: booking?.assignedTo || null,
    };
  });

  return Response.json({ bookings: normalized });
}
