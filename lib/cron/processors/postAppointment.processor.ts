import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import { bookingToUTC } from "@/lib/utils/time";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { getDateWindow } from "@/lib/utils/dateWindow";

export async function runPostAppointmentProcessor() {
  const now = new Date();
  const { yesterday, today } = getDateWindow();

  const bookings = await Booking.find({
    status: { $in: ["confirmed", "unconfirmed"] },
    date: { $in: [yesterday, today] },
  }).limit(200);

  for (const booking of bookings) {
    const business = await Business.findById(booking.businessId);
    if (!business) continue;

    const endUTC = bookingToUTC(booking.date, booking.endTime);
    const diffMinutes = (now.getTime() - endUTC.getTime()) / 60000;

    if (
      diffMinutes >= 15 &&
      !booking.noShowMarked &&
      booking.status !== "completed" &&
      booking.confirmationStatus !== "confirmed"
    ) {
      booking.status = "no_show";
      booking.noShowMarked = true;
      await booking.save();

      await dispatchEmailEvent("NO_SHOW", {
        business,
        booking,
      });
    }
  }
}
