// lib/cron/reminders.ts

import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import { bookingToUTC } from "@/lib/utils/time";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

export async function runReminderJobs() {
  const now = new Date(); // This is UTC

  const bookings = await Booking.find({
    status: "confirmed",
    reminder10mSent: false,
  });

  for (const booking of bookings) {
    const startUTC = bookingToUTC(booking.date, booking.startTime);

    const diffMinutes =
      (startUTC.getTime() - now.getTime()) / 60000;

    // If appointment is 10 minutes away (between 9 and 10 mins window)
    if (diffMinutes <= 10 && diffMinutes > 9) {
      const business = await Business.findById(booking.businessId);

      await dispatchEmailEvent("CHECKIN_WARNING_10M", {
        business,
        booking,
      });

      booking.reminder10mSent = true;
      await booking.save();
    }
  }
}