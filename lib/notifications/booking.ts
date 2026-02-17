import { sendWhatsAppTemplate } from "./whatsapp";
import { WHATSAPP_TEMPLATES } from "./templates";

const PHONE_NUMBER_ID = process.env.SMSLEOPARD_PHONE_NUMBER_ID!;

export async function notifyBookingPending(booking: any, business: any) {
  return sendWhatsAppTemplate({
    destination: business.phone,
    templateId: WHATSAPP_TEMPLATES.BOOKING_PENDING,
    phoneNumberId: PHONE_NUMBER_ID,
    variables: [
      booking.customerName,
      booking.date,
      booking.startTime,
    ],
  });
}

export async function notifyBookingConfirmed(booking: any) {
  return sendWhatsAppTemplate({
    destination: booking.customerPhone,
    templateId: WHATSAPP_TEMPLATES.BOOKING_CONFIRMED,
    phoneNumberId: PHONE_NUMBER_ID,
    variables: [
      booking.customerName,
      booking.date,
      booking.startTime,
    ],
  });
}

export async function notifyBookingRejected(booking: any) {
  return sendWhatsAppTemplate({
    destination: booking.customerPhone,
    templateId: WHATSAPP_TEMPLATES.BOOKING_REJECTED,
    phoneNumberId: PHONE_NUMBER_ID,
    variables: [
      booking.customerName,
      booking.date,
    ],
  });
}
