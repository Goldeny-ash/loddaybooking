// lib/email/sendEmail.ts

import { transporter } from "./transporter";
import { emailTemplates } from "./templates";

export type TemplateKey = keyof typeof emailTemplates;

type SendEmailOptions = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: {
    filename: string;
    path?: string;
    content?: Buffer;
  }[];
};

/* =====================================================
   TEMPLATE → ALIAS MAP
   Controls which alias sends each email type
===================================================== */

const templateAliasMap: Partial<Record<TemplateKey, string>> = {
  /* ================= BOOKING CREATION ================= */
  BOOKING_RECEIVED_CUSTOMER: "bookings@lodday.com",
  NEW_BOOKING_BUSINESS: "bookings@lodday.com",

  /* ================= APPROVAL FLOW ================= */
  DEPOSIT_PAYMENT_REQUEST: "bookings@lodday.com",
  BOOKING_CONFIRMED_WITH_DEPOSIT: "bookings@lodday.com",
  DEPOSIT_RECEIVED: "bookings@lodday.com",
  MARK_BOOKING_COMPLETE_REMINDER: "bookings@lodday.com",

  /* ================= STATUS CHANGES ================= */
  BOOKING_REJECTED: "bookings@lodday.com",
  BOOKING_RESCHEDULED: "bookings@lodday.com",
  BOOKING_CANCELLED: "bookings@lodday.com",

  /* ================= REFUNDS ================= */
  REFUND_REQUESTED: "bookings@lodday.com",
  REFUND_APPROVED: "bookings@lodday.com",
  REFUND_REJECTED: "bookings@lodday.com",

  /* ================= REMINDERS ================= */
  APPOINTMENT_REMINDER_24H: "bookings@lodday.com",
  APPOINTMENT_REMINDER_1H: "bookings@lodday.com",
  APPOINTMENT_REMINDER_30M: "bookings@lodday.com",
  CHECKIN_WARNING_10M: "bookings@lodday.com",
  SLOT_RELEASED_NOTICE: "bookings@lodday.com",
  NO_SHOW_NOTICE: "bookings@lodday.com",
  DAILY_APPOINTMENT_SUMMARY: "bookings@lodday.com",
  BUSINESS_10_MIN_ALERT: "bookings@lodday.com",
  STAFF_BOOKING_ASSIGNED: "bookings@lodday.com",

  /* ================= INVOICE ================= */
  INVOICE_REQUESTED_NOTIFICATION: "bookings@lodday.com",
  INVOICE_SENT_CUSTOMER: "bookings@lodday.com",
  INVOICE_REMINDER_BUSINESS: "bookings@lodday.com",

  /* ================= FOLLOW UP ================= */
  POST_APPOINTMENT_THANK_YOU: "bookings@lodday.com",

  /* ================= SUBSCRIPTION ================= */
  TRIAL_EXPIRING: "subscriptions@lodday.com",
  TRIAL_EXPIRED: "subscriptions@lodday.com",
  SUBSCRIPTION_SUCCESS: "subscriptions@lodday.com",
  SUBSCRIPTION_RENEWED: "subscriptions@lodday.com",
  SUBSCRIPTION_FAILED: "subscriptions@lodday.com",
  SUBSCRIPTION_GRACE_WARNING: "subscriptions@lodday.com",
  SUBSCRIPTION_EXPIRED: "subscriptions@lodday.com",

  /* ================= MARKETING ================= */
  PROMO_ANNOUNCEMENT: "promo@lodday.com",
};

/* =====================================================
   TEMPLATE → DISPLAY NAME MAP
===================================================== */

const displayNameMap: Partial<Record<TemplateKey, string>> = {
  /* Booking */
  BOOKING_RECEIVED_CUSTOMER: "Lodday Bookings",
  NEW_BOOKING_BUSINESS: "Lodday Bookings",
  DEPOSIT_PAYMENT_REQUEST: "Lodday Bookings",
  BOOKING_CONFIRMED_WITH_DEPOSIT: "Lodday Bookings",
  DEPOSIT_RECEIVED: "Lodday Escrow",
  MARK_BOOKING_COMPLETE_REMINDER: "Lodday Escrow",

  BOOKING_REJECTED: "Lodday Bookings",
  BOOKING_RESCHEDULED: "Lodday Bookings",
  BOOKING_CANCELLED: "Lodday Bookings",

  REFUND_REQUESTED: "Lodday Billing",
  REFUND_APPROVED: "Lodday Billing",
  REFUND_REJECTED: "Lodday Billing",

  APPOINTMENT_REMINDER_24H: "Lodday Reminder",
  APPOINTMENT_REMINDER_1H: "Lodday Reminder",
  APPOINTMENT_REMINDER_30M: "Lodday Reminder",
  CHECKIN_WARNING_10M: "Lodday Reminder",
  SLOT_RELEASED_NOTICE: "Lodday Reminder",
  NO_SHOW_NOTICE: "Lodday Reminder",

  DAILY_APPOINTMENT_SUMMARY: "Lodday Schedule",
  BUSINESS_10_MIN_ALERT: "Lodday Dispatch",
  STAFF_BOOKING_ASSIGNED: "Lodday Dispatch",

  /* Invoice */
  INVOICE_REQUESTED_NOTIFICATION: "Lodday Bookings",
  INVOICE_SENT_CUSTOMER: "Lodday Billing",
  INVOICE_REMINDER_BUSINESS: "Lodday Billing",

  /* Follow-up */
  POST_APPOINTMENT_THANK_YOU: "Lodday",

  /* Subscription */
  TRIAL_EXPIRING: "Lodday Billing",
  TRIAL_EXPIRED: "Lodday Billing",
  SUBSCRIPTION_SUCCESS: "Lodday Billing",
  SUBSCRIPTION_RENEWED: "Lodday Billing",
  SUBSCRIPTION_FAILED: "Lodday Billing",
  SUBSCRIPTION_GRACE_WARNING: "Lodday Billing",
  SUBSCRIPTION_EXPIRED: "Lodday Billing",

  /* Marketing */
  PROMO_ANNOUNCEMENT: "Lodday Promotions",
};

/* =====================================================
   CORE SEND FUNCTION
===================================================== */

export async function sendEmail(
  templateKey: TemplateKey,
  options: SendEmailOptions,
  data: unknown
) {
  console.log("[EMAIL] Attempting send", {
    templateKey,
    to: options?.to,
  });

  const template = emailTemplates[templateKey];

  if (!template) {
    console.error("[EMAIL] Template not found:", templateKey);
    throw new Error(`Email template "${templateKey}" not found`);
  }

  const fromAlias =
    templateAliasMap[templateKey] ?? "notifications@lodday.com";

  const displayName =
    displayNameMap[templateKey] ?? "Lodday";

  const smtpFromRaw = process.env.SMTP_FROM || process.env.SMTP_USER || "";
  const smtpFrom = smtpFromRaw.trim();

  console.log("[EMAIL] SMTP CONFIG", {
    smtpFrom,
    hasSMTP_FROM: !!process.env.SMTP_FROM,
    hasSMTP_USER: !!process.env.SMTP_USER,
  });

  if (!smtpFrom) {
    console.error("[EMAIL] SMTP_FROM missing");
    throw new Error("SMTP_FROM/SMTP_USER is not configured");
  }

  const to = Array.isArray(options.to)
    ? options.to.map((x) => x.trim()).filter(Boolean)
    : options.to.trim();

  if (!to || (Array.isArray(to) && to.length === 0)) {
    console.error("[EMAIL] No valid recipients", options.to);
    throw new Error("No recipients defined");
  }

  try {
    const subject = template.subject(data);
    const html = template.html(data);

    console.log("[EMAIL] Rendering OK", {
      subjectPreview: subject?.slice(0, 50),
    });

    const result = await transporter.sendMail({
      from: `"${displayName}" <${smtpFrom}>`,
      replyTo: fromAlias !== smtpFrom ? fromAlias : undefined,
      to,
      subject,
      html,
    });

    console.log("[EMAIL] SUCCESS", {
      messageId: result?.messageId,
      accepted: result?.accepted,
      rejected: result?.rejected,
    });

    return result;

  } catch (error) {
    console.error("[EMAIL_ERROR]", {
      templateKey,
      error,
    });
    throw error;
  }
}