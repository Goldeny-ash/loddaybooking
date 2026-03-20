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
    content?: string | Buffer;
    contentType?: string;
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
  BOOKING_CONFIRMED_NO_DEPOSIT: "bookings@lodday.com",
  BOOKING_CONFIRMED_WITH_DEPOSIT: "bookings@lodday.com",
  DEPOSIT_RECEIVED: "bookings@lodday.com",
  MARK_BOOKING_COMPLETE_REMINDER: "bookings@lodday.com",

  /* ================= STATUS CHANGES ================= */
  BOOKING_REJECTED: "bookings@lodday.com",
  BOOKING_RESCHEDULED: "bookings@lodday.com",
  BOOKING_CANCELLED: "bookings@lodday.com",
  BOOKING_CONFIRMATION_CONFIRMED: "bookings@lodday.com",

  /* ================= REFUNDS ================= */
  REFUND_REQUESTED: "bookings@lodday.com",
  REFUND_APPROVED: "bookings@lodday.com",
  REFUND_REJECTED: "bookings@lodday.com",

  /* ================= REMINDERS ================= */
  APPOINTMENT_REMINDER_24H: "bookings@lodday.com",
  APPOINTMENT_REMINDER_1H: "bookings@lodday.com",
  APPOINTMENT_REMINDER_30M: "bookings@lodday.com",
  BOOKING_CONFIRMATION_BUSINESS_ALERT_45M: "bookings@lodday.com",
  BOOKING_CONFIRMATION_BUSINESS_ALERT_30M: "bookings@lodday.com",
  NO_SHOW_NOTICE: "bookings@lodday.com",
  DAILY_APPOINTMENT_SUMMARY: "bookings@lodday.com",
  STAFF_BOOKING_ASSIGNED: "bookings@lodday.com",

  /* ================= INVOICE ================= */
  INVOICE_REQUESTED_NOTIFICATION: "bookings@lodday.com",
  INVOICE_SENT_CUSTOMER: "bookings@lodday.com",
  INVOICE_REMINDER_BUSINESS: "bookings@lodday.com",

  /* ================= FOLLOW UP ================= */
  POST_APPOINTMENT_THANK_YOU: "bookings@lodday.com",

  /* ================= SUBSCRIPTION ================= */
  TRIAL_STARTED: "subscriptions@lodday.com",
  TRIAL_EXPIRING: "subscriptions@lodday.com",
  TRIAL_EXPIRED: "subscriptions@lodday.com",
  SUBSCRIPTION_SUCCESS: "subscriptions@lodday.com",
  SUBSCRIPTION_RENEWED: "subscriptions@lodday.com",
  SUBSCRIPTION_FAILED: "subscriptions@lodday.com",
  SUBSCRIPTION_GRACE_WARNING: "subscriptions@lodday.com",
  SUBSCRIPTION_EXPIRED: "subscriptions@lodday.com",

  /* ================= ONBOARDING ================= */
  BUSINESS_WELCOME: "welcome@lodday.com",
  AFFILIATE_APPROVED: "affiliates@lodday.com",
  AFFILIATE_REJECTED: "affiliates@lodday.com",
  AFFILIATE_APPLICATION_RECEIVED: "affiliates@lodday.com",
  AFFILIATE_APPLICATION_REVIEW_ALERT: "affiliates@lodday.com",
  MARKETPLACE_REQUEST_RECEIVED: "marketplace@lodday.com",
  MARKETPLACE_REQUEST_ADMIN_ALERT: "marketplace@lodday.com",
  MARKETPLACE_APPROVED: "marketplace@lodday.com",
  MARKETPLACE_REJECTED: "marketplace@lodday.com",

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
  BOOKING_CONFIRMED_NO_DEPOSIT: "Lodday Bookings",
  BOOKING_CONFIRMED_WITH_DEPOSIT: "Lodday Bookings",
  DEPOSIT_RECEIVED: "Lodday Escrow",
  MARK_BOOKING_COMPLETE_REMINDER: "Lodday Escrow",

  BOOKING_REJECTED: "Lodday Bookings",
  BOOKING_RESCHEDULED: "Lodday Bookings",
  BOOKING_CANCELLED: "Lodday Bookings",
  BOOKING_CONFIRMATION_CONFIRMED: "Lodday Bookings",

  REFUND_REQUESTED: "Lodday Billing",
  REFUND_APPROVED: "Lodday Billing",
  REFUND_REJECTED: "Lodday Billing",

  APPOINTMENT_REMINDER_24H: "Lodday Reminder",
  APPOINTMENT_REMINDER_1H: "Lodday Reminder",
  APPOINTMENT_REMINDER_30M: "Lodday Reminder",
  BOOKING_CONFIRMATION_BUSINESS_ALERT_45M: "Lodday Reminder",
  BOOKING_CONFIRMATION_BUSINESS_ALERT_30M: "Lodday Reminder",
  NO_SHOW_NOTICE: "Lodday Reminder",

  DAILY_APPOINTMENT_SUMMARY: "Lodday Schedule",
  STAFF_BOOKING_ASSIGNED: "Lodday Dispatch",

  /* Invoice */
  INVOICE_REQUESTED_NOTIFICATION: "Lodday Bookings",
  INVOICE_SENT_CUSTOMER: "Lodday Billing",
  INVOICE_REMINDER_BUSINESS: "Lodday Billing",

  /* Follow-up */
  POST_APPOINTMENT_THANK_YOU: "Lodday",

  /* Subscription */
  TRIAL_STARTED: "Lodday Billing",
  TRIAL_EXPIRING: "Lodday Billing",
  TRIAL_EXPIRED: "Lodday Billing",
  SUBSCRIPTION_SUCCESS: "Lodday Billing",
  SUBSCRIPTION_RENEWED: "Lodday Billing",
  SUBSCRIPTION_FAILED: "Lodday Billing",
  SUBSCRIPTION_GRACE_WARNING: "Lodday Billing",
  SUBSCRIPTION_EXPIRED: "Lodday Billing",

  /* Onboarding */
  BUSINESS_WELCOME: "Lodday",
  AFFILIATE_APPROVED: "Lodday Affiliates",
  AFFILIATE_REJECTED: "Lodday Affiliates",
  AFFILIATE_APPLICATION_RECEIVED: "Lodday Affiliates",
  AFFILIATE_APPLICATION_REVIEW_ALERT: "Lodday Affiliates",
  MARKETPLACE_REQUEST_RECEIVED: "Lodday Marketplace",
  MARKETPLACE_REQUEST_ADMIN_ALERT: "Lodday Marketplace",
  MARKETPLACE_APPROVED: "Lodday Marketplace",
  MARKETPLACE_REJECTED: "Lodday Marketplace",

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
  const cc = Array.isArray(options.cc)
    ? options.cc.map((x) => x.trim()).filter(Boolean)
    : options.cc?.trim();
  const bcc = Array.isArray(options.bcc)
    ? options.bcc.map((x) => x.trim()).filter(Boolean)
    : options.bcc?.trim();

  if (!to || (Array.isArray(to) && to.length === 0)) {
    console.error("[EMAIL] No valid recipients", options.to);
    throw new Error("No recipients defined");
  }

  try {
    const subject =
      typeof template.subject === "function" ? template.subject(data) : template.subject;
    const html = typeof template.html === "function" ? template.html(data) : template.html;

    console.log("[EMAIL] Rendering OK", {
      subjectPreview: subject?.slice(0, 50),
    });

    const result = await transporter.sendMail({
      from: `"${displayName}" <${smtpFrom}>`,
      replyTo: fromAlias !== smtpFrom ? fromAlias : undefined,
      to,
      cc,
      bcc,
      subject,
      html,
      attachments: options.attachments,
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
