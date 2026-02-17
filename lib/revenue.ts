import Booking from "@/lib/models/Booking";

export async function getRevenueStats(businessId: string) {
  const bookings = await Booking.find({ businessId }).populate("serviceId", "price").lean();

  const totalRevenue = bookings.reduce((acc, b) => acc + (b.serviceId?.price || 0), 0);

  const revenueByDay: Record<string, number> = {};
  bookings.forEach((b) => {
    if (!b.date) return;
    revenueByDay[b.date] = (revenueByDay[b.date] || 0) + (b.serviceId?.price || 0);
  });

  return { totalRevenue, revenueByDay };
}
