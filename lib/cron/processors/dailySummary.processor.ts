import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { getDateWindow } from "@/lib/utils/dateWindow";

export async function runDailySummaryProcessor() {
  const { tomorrow } = getDateWindow();

  const businesses = await Business.find({
    "access.status": "ACTIVE",
  }).lean();

  for (const business of businesses) {
    const bookings = await Booking.find({
      businessId: business._id,
      status: "confirmed",
      date: tomorrow,
    }).lean();

    if (!bookings.length) continue;

    await dispatchEmailEvent("DAILY_SUMMARY", {
      business,
      bookings,
    });
  }
}
