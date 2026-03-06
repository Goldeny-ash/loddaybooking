import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import { bookingToUTC } from "@/lib/utils/time";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

import {getDateWindow} from "@/lib/utils/dateWindow";

export async function runReminderProcessor() {
  const now = new Date();
const { today, tomorrow } = getDateWindow();

  const bookings = await Booking.find({
  status: "confirmed",
  date: { $in: [today, tomorrow] }, // 🔥 SCALE FIX
})
.limit(200) // 🔥 BATCH LIMIT
.lean();

  for (const booking of bookings) {
    const startUTC = bookingToUTC(booking.date, booking.startTime);
    const diffMinutes =
      (startUTC.getTime() - now.getTime()) / 60000;

    const business = await Business.findById(booking.businessId);

    // 24 Hours
    if (diffMinutes <= 1440 && diffMinutes > 1435 && !booking.reminder24hSent) {
      await dispatchEmailEvent("REMINDER_24H", { business, booking });
      booking.reminder24hSent = true;
    }

    // 1 Hour
    if (diffMinutes <= 60 && diffMinutes > 59 && !booking.reminder1hSent) {
      await dispatchEmailEvent("REMINDER_1H", { business, booking });
      booking.reminder1hSent = true;
    }

    // 30 Minutes
    if (diffMinutes <= 30 && diffMinutes > 29 && !booking.reminder30mSent) {
      await dispatchEmailEvent("REMINDER_30M", { business, booking });
      booking.reminder30mSent = true;
    }

    // 10 Minutes Check-in Warning
    if (diffMinutes <= 10 && diffMinutes > 9 && !booking.reminder10mSent) {
      await dispatchEmailEvent("CHECKIN_WARNING_10M", {
        business,
        booking,
        checkInUrl: `${process.env.APP_URL}/checkin/${booking._id}`,
      });
      // SLOT RELEASE (10 mins after start if not checked in)
if (
  booking.status === "confirmed" &&
  diffMinutes <= -10 &&
  !booking.slotReleasedAt &&
  !booking.checkedIn
) {
  booking.slotReleasedAt = new Date();

  await dispatchEmailEvent("SLOT_RELEASED", {
    business,
    booking,
  });

  await booking.save();
}


      await dispatchEmailEvent("BUSINESS_10M_ALERT", {
        business,
        booking,
      });

      booking.reminder10mSent = true;
    }

    await booking.save();
  }
}