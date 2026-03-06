import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import { bookingToUTC } from "@/lib/utils/time";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { getDateWindow } from "@/lib/utils/dateWindow";

export async function runPostAppointmentProcessor() {
  const now = new Date();
  const { yesterday, today } = getDateWindow();
  const appUrl = (process.env.APP_URL || "https://booking.lodday.com").replace(/\/$/, "");

  const bookings = await Booking.find({
    status: "confirmed",
    date: { $in: [yesterday, today] },
  }).limit(200);

  for (const booking of bookings) {
    const business = await Business.findById(booking.businessId);
    if (!business) continue;

    const endUTC = bookingToUTC(booking.date, booking.endTime);
    const diffMinutes = (now.getTime() - endUTC.getTime()) / 60000;

    // Send customer completion prompt 10 mins after end, once.
    if (diffMinutes >= 10 && !booking.completionReminderSent) {
      await dispatchEmailEvent("MARK_COMPLETE_REMINDER", {
        business,
        booking,
        completeUrl: `${appUrl}/b/${business.username}/manage?bookingId=${booking._id}&token=${booking.manageToken}`,
      });

      booking.completionReminderSent = true;
      await booking.save();
    }

    // Auto no-show after 30 mins if still not completed.
    if (diffMinutes >= 30 && !booking.noShowMarked) {
      booking.status = "no_show";

      await dispatchEmailEvent("NO_SHOW", {
        business,
        booking,
      });

      booking.noShowMarked = true;
      await booking.save();
    }
  }
}
