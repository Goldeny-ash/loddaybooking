import { sendEmail } from "./sendEmail";
import type { TemplateKey } from "./sendEmail";
import { EmailEvent } from "./types";
import { getTheme } from "@/lib/theme";
import { buildDashboardUrl } from "@/lib/booking/utils";

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
          { booking, manageUrl: payload.manageUrl }
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
          { booking, manageUrl: payload.manageUrl }
        );
      } else {
        await send("BOOKING_CONFIRMED_WITH_DEPOSIT",
          { to: bookingObj.customerEmail },
          { booking, manageUrl: payload.manageUrl }
        );
      }
      break;

    case "BOOKING_REJECTED":
      await send("BOOKING_REJECTED",
        { to: bookingObj.customerEmail },
        { booking, rescheduleUrl: payload.rescheduleUrl }
      );
      break;

    case "BOOKING_RESCHEDULED":
      await send("BOOKING_RESCHEDULED",
        { to: bookingObj.customerEmail },
        { booking }
      );
      break;

    case "DEPOSIT_PAID":
      await send("BOOKING_CONFIRMED_WITH_DEPOSIT",
        { to: bookingObj.customerEmail },
        { booking, manageUrl: payload.manageUrl }
      );

      await send("DEPOSIT_RECEIVED",
        { to: businessObj.email },
        { booking, dashboardUrl: payload.dashboardUrl || buildDashboardUrl() }
      );
      break;

    case "MARK_COMPLETE_REMINDER":
      await send("MARK_BOOKING_COMPLETE_REMINDER",
        { to: bookingObj.customerEmail },
        { booking, completeUrl: payload.completeUrl }
      );
      break;

    case "POST_APPOINTMENT_THANK_YOU":
      await send("POST_APPOINTMENT_THANK_YOU",
        { to: bookingObj.customerEmail },
        { reviewUrl: payload.reviewUrl, rebookUrl: payload.rebookUrl }
      );
      break;

    case "NO_SHOW":
      await send("NO_SHOW_NOTICE",
        { to: bookingObj.customerEmail },
        {}
      );
      break;

    case "SLOT_RELEASED":
      await send("SLOT_RELEASED_NOTICE",
        { to: bookingObj.customerEmail },
        {}
      );
      break;

    /* =====================================================
       REMINDERS
    ===================================================== */

    case "REMINDER_24H":
      await send("APPOINTMENT_REMINDER_24H",
        { to: bookingObj.customerEmail },
        { booking }
      );
      break;

    case "REMINDER_1H":
      await send("APPOINTMENT_REMINDER_1H",
        { to: bookingObj.customerEmail },
        { booking }
      );
      break;

    case "REMINDER_30M":
      await send("APPOINTMENT_REMINDER_30M",
        { to: bookingObj.customerEmail },
        { booking }
      );
      break;

    case "CHECKIN_WARNING_10M":
      await send("CHECKIN_WARNING_10M",
        { to: bookingObj.customerEmail },
        { booking, checkInUrl: payload.checkInUrl }
      );
      break;

    case "BUSINESS_10M_ALERT":
      await send("BUSINESS_10_MIN_ALERT",
        { to: businessObj.email },
        { booking }
      );
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

    default:
      console.warn("Unhandled email event:", event);
  }
}
