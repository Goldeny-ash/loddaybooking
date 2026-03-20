import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Staff from "@/lib/models/Staff";
import { bookingToUTC } from "@/lib/utils/time";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { getDateWindow } from "@/lib/utils/dateWindow";

function buildConfirmationUrl(bookingId: string, token: string, action: "confirm" | "cancel") {
  const base = (process.env.APP_URL || "https://booking.lodday.com").replace(/\/$/, "");
  return `${base}/api/bookings/${bookingId}/respond?token=${token}&action=${action}`;
}

export async function runReminderProcessor() {
  const now = new Date();
  const { today, tomorrow } = getDateWindow();

  const bookings = await Booking.find({
    status: { $in: ["confirmed", "unconfirmed"] },
    date: { $in: [today, tomorrow] },
  }).limit(200);

  for (const booking of bookings) {
    const startUTC = bookingToUTC(booking.date, booking.startTime);
    const diffMinutes = (startUTC.getTime() - now.getTime()) / 60000;
    const business = await Business.findById(booking.businessId);
    if (!business) continue;

    const staff = booking.assignedTo ? await Staff.findById(booking.assignedTo).lean() : null;
    const confirmUrl = buildConfirmationUrl(booking._id.toString(), booking.manageToken, "confirm");
    const cancelUrl = buildConfirmationUrl(booking._id.toString(), booking.manageToken, "cancel");

    if (diffMinutes <= 1440 && diffMinutes > 1435 && !booking.reminder24hSent) {
      await dispatchEmailEvent("REMINDER_24H", { business, booking });
      booking.reminder24hSent = true;
    }

    if (
      diffMinutes <= 60 &&
      diffMinutes > 59 &&
      !booking.reminder1hSent &&
      booking.confirmationStatus !== "confirmed"
    ) {
      await dispatchEmailEvent("CONFIRMATION_REQUEST_1H", {
        business,
        booking,
        confirmUrl,
        cancelUrl,
      });
      booking.reminder1hSent = true;
      booking.confirmationRequestedAt = booking.confirmationRequestedAt || now;
    }

    if (
      diffMinutes <= 45 &&
      diffMinutes > 44 &&
      !booking.confirmation45mBusinessSent &&
      booking.confirmationStatus !== "confirmed"
    ) {
      await dispatchEmailEvent("BUSINESS_CONFIRMATION_45M_ALERT", {
        business,
        booking,
        staff,
      });
      booking.confirmation45mBusinessSent = true;
    }

    if (
      diffMinutes <= 30 &&
      diffMinutes > 29 &&
      !booking.reminder30mSent &&
      booking.confirmationStatus !== "confirmed"
    ) {
      await dispatchEmailEvent("CONFIRMATION_WARNING_30M", {
        business,
        booking,
        confirmUrl,
        cancelUrl,
      });
      booking.reminder30mSent = true;
    }

    if (
      diffMinutes <= 30 &&
      diffMinutes > 29 &&
      !booking.confirmation30mBusinessSent &&
      booking.confirmationStatus !== "confirmed"
    ) {
      await dispatchEmailEvent("BUSINESS_CONFIRMATION_30M_ALERT", {
        business,
        booking,
        staff,
      });
      booking.confirmation30mBusinessSent = true;
    }

    if (
      diffMinutes <= 20 &&
      diffMinutes > 19 &&
      booking.confirmationStatus !== "confirmed" &&
      booking.status !== "cancelled" &&
      booking.status !== "completed"
    ) {
      booking.status = "unconfirmed";
      booking.confirmationStatus = "not_confirmed";
    }

    await booking.save();
  }
}
