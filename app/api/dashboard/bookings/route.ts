import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";

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

  const query: any = { businessId };

  if (status) {
    query.status = status;
  }

  if (date) {
    query.date = date;
  }

  const bookings = await Booking.find(query)
    .populate("serviceId", "name durationMinutes")
    .populate("staffId", "name")
    .sort({ createdAt: -1 })
    .limit(100);

  return Response.json({ bookings });
}
