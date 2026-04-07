import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { getDateWindow } from "@/lib/utils/dateWindow";

export async function runDailySummaryProcessor() {
  const nowKenya = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Africa/Nairobi",
    })
  );
  const { tomorrow } = getDateWindow();

  if (nowKenya.getHours() < 18) {
    return;
  }

  const businesses = await Business.find({
    "access.status": { $in: ["ACTIVE", "TRIAL", "GRACE"] },
  });

  for (const business of businesses) {
    if (business.dailySummarySentFor === tomorrow) continue;

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

    business.dailySummarySentFor = tomorrow;
    await business.save();
  }
}
