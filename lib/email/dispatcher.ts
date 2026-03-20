import { sendEmail } from "./sendEmail";
import type { TemplateKey } from "./sendEmail";
import { EmailEvent } from "./types";
import { getTheme } from "@/lib/theme";
import { buildDashboardUrl, buildManageBookingUrl } from "@/lib/booking/utils";
import { buildInvoiceAttachment } from "@/lib/email/invoice";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRecipients(input: unknown): string | string[] | undefined {
  if (typeof input === "string") {
    const trimmed = input.trim();
    return isValidEmail(trimmed) ? trimmed : undefined;
  }

  if (Array.isArray(input)) {
    const cleaned = input
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter((x) => isValidEmail(x));
    if (cleaned.length === 0) return undefined;
    return cleaned;
  }

  return undefined;
}

export async function dispatchEmailEvent(
  event: EmailEvent,
  payload: Record<string, unknown>
) {
  const { business, booking, bookings, staff } = payload;
  const businessObj = (business as Record<string, unknown> | undefined) ?? {};
  const bookingObj = (booking as Record<string, unknown> | undefined) ?? {};
  const staffObj = (staff as Record<string, unknown> | undefined) ?? {};
  const theme = business ? getTheme(business) : null;
  const derivedManageUrl =
    typeof payload.manageUrl === "string" && payload.manageUrl.trim()
      ? payload.manageUrl
      : typeof businessObj.username === "string" &&
          bookingObj._id &&
          typeof bookingObj.manageToken === "string"
        ? buildManageBookingUrl({
            username: businessObj.username,
            bookingId: String(bookingObj._id),
            token: bookingObj.manageToken,
          })
        : undefined;
  const invoiceAttachment =
    business && booking && theme
      ? buildInvoiceAttachment({
          business,
          booking,
          theme,
        })
      : null;

const send = async (
  template: TemplateKey,
  options: Record<string, unknown>,
  data: Record<string, unknown>
) => {
  const to = normalizeRecipients(options?.to);

  console.log("[DISPATCH] Preparing send", {
    template,
    rawTo: options?.to,
    normalizedTo: to,
  });

  if (!to) {
    console.warn("[EMAIL_SKIPPED] Invalid recipient", {
      template,
      raw: options?.to,
    });
    return null;
  }

  return sendEmail(template, {
    ...options,
    to,
  }, {
    business,
    theme,
    ...data,
  });
};

  switch (event) {
    /* =====================================================
       BOOKING LIFECYCLE
    ===================================================== */

    case "BOOKING_CREATED": {
  console.log("[DISPATCH] BOOKING_CREATED triggered");

  const customerTo =
    typeof payload.customerEmail === "string"
      ? payload.customerEmail
      : bookingObj.customerEmail;

  const businessTo =
    typeof payload.businessEmail === "string"
      ? payload.businessEmail
      : businessObj.email;

  console.log("[DISPATCH] Recipients", {
    customerTo,
    businessTo,
  });
      if (typeof customerTo === "string" && customerTo.trim()) {
        await send("BOOKING_RECEIVED_CUSTOMER",
          { to: customerTo },
          { booking, manageUrl: derivedManageUrl }
        );
      }

      if (typeof businessTo === "string" && businessTo.trim()) {
        await send("NEW_BOOKING_BUSINESS",
          { to: businessTo },
          { booking, dashboardUrl: payload.dashboardUrl }
        );
      }
      break;
      }

    case "BOOKING_APPROVED":
      if ((Number(bookingObj.depositAmount) || 0) > 0) {
        await send("DEPOSIT_PAYMENT_REQUEST",
          { to: bookingObj.customerEmail },
          { booking, manageUrl: derivedManageUrl }
        );
      } else {
        await send("BOOKING_CONFIRMED_NO_DEPOSIT",
          {
            to: bookingObj.customerEmail,
            attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
          },
          { booking, manageUrl: derivedManageUrl }
        );
      }
      break;

    case "BOOKING_REJECTED":
      await send("BOOKING_REJECTED",
        { to: bookingObj.customerEmail },
        {
          booking,
          rescheduleUrl: payload.rescheduleUrl || derivedManageUrl,
          manageUrl: derivedManageUrl,
        }
      );
      break;

    case "BOOKING_CONFIRMATION_CONFIRMED":
      await send((Number(bookingObj.depositAmount) || 0) > 0 ? "BOOKING_CONFIRMED_WITH_DEPOSIT" : "BOOKING_CONFIRMED_NO_DEPOSIT",
        {
          to: bookingObj.customerEmail,
          attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
        },
        { booking, manageUrl: derivedManageUrl }
      );
      break;

    case "BOOKING_RESCHEDULED":
      await send("BOOKING_RESCHEDULED",
        { to: bookingObj.customerEmail },
        { booking, manageUrl: derivedManageUrl }
      );
      break;

    case "DEPOSIT_PAID":
      await send("BOOKING_CONFIRMED_WITH_DEPOSIT",
        {
          to: bookingObj.customerEmail,
          attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
        },
        { booking, manageUrl: derivedManageUrl }
      );

      await send("DEPOSIT_RECEIVED",
        { to: businessObj.email },
        { booking, dashboardUrl: payload.dashboardUrl || buildDashboardUrl() }
      );
      break;

    case "MARK_COMPLETE_REMINDER":
      await send("MARK_BOOKING_COMPLETE_REMINDER",
        { to: bookingObj.customerEmail },
        { booking, completeUrl: payload.completeUrl, manageUrl: derivedManageUrl }
      );
      break;

    case "POST_APPOINTMENT_THANK_YOU":
      await send("POST_APPOINTMENT_THANK_YOU",
        { to: bookingObj.customerEmail },
        { reviewUrl: payload.reviewUrl, rebookUrl: payload.rebookUrl, booking, manageUrl: derivedManageUrl }
      );
      break;

    case "NO_SHOW":
      await send("NO_SHOW_NOTICE",
        { to: bookingObj.customerEmail },
        { booking, manageUrl: derivedManageUrl }
      );
      break;

    /* =====================================================
       REMINDERS
    ===================================================== */

    case "REMINDER_24H":
      await send("APPOINTMENT_REMINDER_24H",
        { to: bookingObj.customerEmail },
        { booking, manageUrl: derivedManageUrl }
      );
      break;

    case "CONFIRMATION_REQUEST_1H":
      await send("APPOINTMENT_REMINDER_1H",
        { to: bookingObj.customerEmail },
        { booking, confirmUrl: payload.confirmUrl, cancelUrl: payload.cancelUrl, manageUrl: derivedManageUrl }
      );
      break;

    case "CONFIRMATION_WARNING_30M":
      await send("APPOINTMENT_REMINDER_30M",
        { to: bookingObj.customerEmail },
        { booking, confirmUrl: payload.confirmUrl, cancelUrl: payload.cancelUrl, manageUrl: derivedManageUrl }
      );
      break;

    case "BUSINESS_CONFIRMATION_45M_ALERT":
      await send("BOOKING_CONFIRMATION_BUSINESS_ALERT_45M",
        { to: businessObj.email },
        { booking }
      );
      if (staffObj.email) {
        await send("BOOKING_CONFIRMATION_BUSINESS_ALERT_45M",
          { to: staffObj.email },
          { booking }
        );
      }
      break;

    case "BUSINESS_CONFIRMATION_30M_ALERT":
      await send("BOOKING_CONFIRMATION_BUSINESS_ALERT_30M",
        { to: businessObj.email },
        { booking }
      );
      if (staffObj.email) {
        await send("BOOKING_CONFIRMATION_BUSINESS_ALERT_30M",
          { to: staffObj.email },
          { booking }
        );
      }
      break;

    case "DAILY_SUMMARY":
      await send("DAILY_APPOINTMENT_SUMMARY",
        { to: businessObj.email },
        { bookings }
      );
      break;

    /* =====================================================
       STAFF
    ===================================================== */

    case "STAFF_ASSIGNED":
      await send("STAFF_BOOKING_ASSIGNED",
        { to: staffObj.email },
        { booking, staffName: staffObj.name }
      );
      break;

    /* =====================================================
       REFUNDS
    ===================================================== */

    case "REFUND_REQUESTED":
      await send("REFUND_REQUESTED",
        { to: businessObj.email, cc: "support@lodday.com" },
        { booking }
      );
      break;

    case "REFUND_APPROVED":
      await send("REFUND_APPROVED",
        { to: bookingObj.customerEmail },
        { booking }
      );
      break;

    case "REFUND_REJECTED":
      await send("REFUND_REJECTED",
        { to: bookingObj.customerEmail },
        { reason: payload.reason }
      );
      break;

    /* =====================================================
       SUBSCRIPTIONS
    ===================================================== */

    case "TRIAL_STARTED":
      await send("TRIAL_STARTED",
        { to: businessObj.email },
        { dashboardUrl: payload.dashboardUrl || buildDashboardUrl() }
      );
      break;

    case "TRIAL_EXPIRING":
      await send("TRIAL_EXPIRING",
        { to: businessObj.email },
        { upgradeUrl: payload.upgradeUrl }
      );
      break;

    case "TRIAL_EXPIRED":
      await send("TRIAL_EXPIRED",
        { to: businessObj.email },
        { upgradeUrl: payload.upgradeUrl }
      );
      break;

    case "SUBSCRIPTION_SUCCESS":
      await send("SUBSCRIPTION_SUCCESS",
        { to: businessObj.email },
        {}
      );
      break;

    case "SUBSCRIPTION_RENEWED":
      await send("SUBSCRIPTION_RENEWED",
        { to: businessObj.email },
        {}
      );
      break;

    case "SUBSCRIPTION_FAILED":
      await send("SUBSCRIPTION_FAILED",
        { to: businessObj.email },
        { retryUrl: payload.retryUrl }
      );
      break;

    case "SUBSCRIPTION_GRACE_WARNING":
      await send("SUBSCRIPTION_GRACE_WARNING",
        { to: businessObj.email },
        { retryUrl: payload.retryUrl }
      );
      break;

    case "SUBSCRIPTION_EXPIRED":
      await send("SUBSCRIPTION_EXPIRED",
        { to: businessObj.email },
        { retryUrl: payload.retryUrl }
      );
      break;

    case "BUSINESS_WELCOME":
      await send("BUSINESS_WELCOME",
        { to: businessObj.email },
        { dashboardUrl: payload.dashboardUrl || buildDashboardUrl() }
      );
      break;

    default:
      console.warn("Unhandled email event:", event);
  }
}
