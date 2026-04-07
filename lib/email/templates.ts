import { emailLayout } from "./layout";
import { BrandTheme } from "@/lib/theme";
import { formatDuration } from "@/lib/utils/formatDuration";
import { formatBookingPrice } from "@/lib/utils/bookingPresentation";
import { buildInvoiceAttachment } from "./invoice";

type TemplateDefinition = {
  subject: string | ((data: any) => string);
  html: string | ((data: any) => string);
  text?: string | ((data: any) => string);
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatCurrency(value: unknown) {
  const amount = Number(value || 0);
  return `KES ${amount.toLocaleString()}`;
}

function renderIf(condition: unknown, html: string) {
  return condition ? html : "";
}

function renderDetail(label: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  return `<p style="margin:0 0 8px;"><strong>${label}:</strong> ${value}</p>`;
}

function renderList(items: string[]) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return "";
  return `<ul style="margin:8px 0 0;padding-left:18px;">${filtered
    .map((item) => `<li style="margin-bottom:4px;">${item}</li>`)
    .join("")}</ul>`;
}

function renderEmailButton(url: string, label: string, color: string) {
  if (!hasText(url)) return "";
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top:24px;">
  <tr>
    <td align="center" bgcolor="${color}" style="border-radius:999px;">
      <a href="${url}"
        style="
          display:inline-block;
          padding:14px 24px;
          font-weight:600;
          color:#ffffff;
          text-decoration:none;
          border-radius:999px;
          font-family:'Inria Serif', serif;
        ">
        ${label}
      </a>
    </td>
  </tr>
</table>
`;
}

function renderManageSection(data: any, label = "Manage Booking") {
  if (!hasText(data?.manageUrl)) return "";
  return renderEmailButton(data.manageUrl, label, data?.theme?.primary || "#111827");
}

function renderInvoiceNotice(data: any) {
  if (!data?.business || !data?.booking || !data?.theme) return "";

  const attachment = buildInvoiceAttachment({
    business: data.business,
    booking: data.booking,
    theme: data.theme,
  });

  return `
    <div style="margin:20px 0;padding:16px;border-radius:18px;background:${data.theme.backgroundSoft};">
      <p style="margin:0 0 8px;font-weight:700;">Invoice attached</p>
      <p style="margin:0;line-height:1.7;">
        A PDF invoice is attached as <strong>${attachment.filename}</strong>. It includes your selected services,
        any discount applied, the deposit paid if any, and the balance due after service completion.
      </p>
    </div>
  `;
}

function renderServiceCards(services: any[], options?: { imageOnLeft?: boolean }) {
  return (services || [])
    .map((service: any) => {
      const title = service.serviceName || service?.serviceId?.name || "Selected Service";
      const details = [
        renderDetail("Price", formatBookingPrice(service)),
        renderDetail("Duration", formatDuration(service.durationMinutes)),
        renderDetail(
          "Tier",
          service.selectedTier?.label
            ? service.selectedTier.label
            : ""
        ),
      ]
        .filter(Boolean)
        .join("");

      const metaList = [
        ...(service.selectedAddOns || []).map(
          (item: any) => `Add-on: ${item.title}${item.price !== undefined ? ` - ${formatCurrency(item.price)}` : ""}`
        ),
        ...(service.selectedSessions || []).map(
          (item: any) =>
            `${item.sessions} Sessions${item.price !== undefined ? ` - ${formatCurrency(item.price)}` : ""}`
        ),
        ...(service.selectedAreas || []).map(
          (item: any) => `${item.area}${item.price !== undefined ? ` - ${formatCurrency(item.price)}` : ""}`
        ),
      ];

      const imageCell = hasText(service.serviceImage)
        ? `
          <td style="width:168px;padding-right:18px;vertical-align:top;">
            <img
              src="${service.serviceImage}"
              alt="${title}"
              draggable="false"
              style="display:block;width:168px;height:168px;object-fit:cover;border-radius:16px;-webkit-user-drag:none;pointer-events:none;"
            />
          </td>
        `
        : "";

      const contentCell = `
        <td style="vertical-align:top;">
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1f2937;">${title}</p>
          ${renderIf(hasText(service.serviceDescription), `<p style="margin:0 0 10px;color:#6b7280;">${service.serviceDescription}</p>`)}
          ${details}
          ${renderList(metaList)}
        </td>
      `;

      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="margin:0 0 16px;background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:20px;">
          <tr>
            ${
              options?.imageOnLeft !== false
                ? `${imageCell}${contentCell}`
                : `${contentCell}${imageCell}`
            }
          </tr>
        </table>
      `;
    })
    .join("");
}

export const emailTemplates: Record<string, TemplateDefinition> = {

  /* =====================================================
     BOOKING RECEIVED — CUSTOMER
  ===================================================== */
BOOKING_RECEIVED_CUSTOMER: {
  subject: (data) => {
    if (data.booking.status === "confirmed") {
      return `Booking Confirmed: ${data.business.name}`;
    }

    return `Booking Submitted: ${data.business.name}`;
  },

  html: (data) => {
    const { business, theme, booking, manageUrl } = data;

    const isConfirmed = booking.status === "confirmed";

    const mobileBlock =
      booking.isMobile && booking.customerLocation
        ? `
          <div style="margin:18px 0;padding:16px;border-radius:16px;background:${theme.backgroundSoft};">
            <p style="margin:0 0 8px;"><strong>Mobile Service</strong></p>
            ${renderDetail("Service Address", booking.customerLocation.address)}
            ${renderDetail(
              "Google Maps",
              hasText(booking.customerLocation.mapsLink)
                ? `<a href="${booking.customerLocation.mapsLink}" target="_blank" rel="noreferrer">Open location</a>`
                : ""
            )}
            ${renderDetail(
              "Distance",
              typeof booking.distanceKm === "number" ? `${booking.distanceKm.toFixed(1)} km` : ""
            )}
          </div>
        `
        : "";

    const statusText = isConfirmed
      ? `<p>Your appointment with <strong>${business.name}</strong> has been <strong>confirmed</strong>.</p>`
      : `<p>Your booking request with <strong>${business.name}</strong> has been submitted and is awaiting approval.</p>`;

    const content = `
      <p>Hi ${booking.customerName},</p>

      ${statusText}

      ${renderDetail("Date", booking.date)}
      ${renderDetail("Time", hasText(booking.startTime) && hasText(booking.endTime) ? `${booking.startTime} - ${booking.endTime}` : "")}

      ${mobileBlock}

      <h4 style="margin:24px 0 12px;">Services Selected</h4>

      ${renderServiceCards(booking.services, { imageOnLeft: true })}

      ${renderDetail("Subtotal", formatCurrency(booking.subtotal))}
      ${renderDetail("Callout Fee", Number(booking.calloutFee || 0) > 0 ? formatCurrency(booking.calloutFee) : "")}
      <p><strong>Grand Total: ${formatCurrency(booking.grandTotal)}</strong></p>

      ${
        booking.depositAmount > 0
          ? `
          <p>
            If approved, a deposit of <strong>${formatCurrency(booking.depositAmount)}</strong>
            will be required. This deposit is part of the total service cost.
          </p>
          <p>
            Funds are securely held by Lodday and cannot be withdrawn by the business
            until the booking is marked complete.
          </p>
        `
          : ""
      }

      ${renderManageSection({ manageUrl, theme })}
    `;

    return emailLayout(business, theme, content);
  },
},

  /* =====================================================
     NEW BOOKING — BUSINESS
  ===================================================== */
NEW_BOOKING_BUSINESS: {
  subject: (data) => {
    if (data.booking.status === "confirmed") {
      return `New Confirmed Booking: ${data.booking.bookingKey}`;
    }

    return `New Booking Request: ${data.booking.bookingKey}`;
  },

  html: (data) => {
    const { business, theme, booking, dashboardUrl } = data;

    const isConfirmed = booking.status === "confirmed";

    const mobileBlock =
      booking.isMobile && booking.customerLocation
        ? `
          <div style="margin:18px 0;padding:16px;border-radius:16px;background:${theme.backgroundSoft};">
            <p style="margin:0 0 8px;"><strong>Mobile Service</strong></p>
            ${renderDetail("Address", booking.customerLocation.address)}
            ${renderDetail(
              "Google Maps",
              hasText(booking.customerLocation.mapsLink)
                ? `<a href="${booking.customerLocation.mapsLink}" target="_blank" rel="noreferrer">Open location</a>`
                : ""
            )}
            ${renderDetail(
              "Distance",
              typeof booking.distanceKm === "number" ? `${booking.distanceKm.toFixed(1)} km` : ""
            )}
          </div>
        `
        : "";

    const statusText = isConfirmed
      ? `<p>A new booking has been <strong>automatically confirmed</strong>.</p>`
      : `<p>A new booking request has been submitted and is awaiting your approval.</p>`;

    const content = `
      <p>Hello ${business.name},</p>

      ${statusText}

      ${renderDetail("Customer", booking.customerName)}
      ${renderDetail("Date", booking.date)}
      ${renderDetail("Time", hasText(booking.startTime) && hasText(booking.endTime) ? `${booking.startTime} - ${booking.endTime}` : "")}

      ${mobileBlock}

      <h4 style="margin:24px 0 12px;">Services Selected</h4>

      ${renderServiceCards(booking.services, { imageOnLeft: true })}

      ${renderDetail("Subtotal", formatCurrency(booking.subtotal))}
      ${renderDetail("Callout Fee", Number(booking.calloutFee || 0) > 0 ? formatCurrency(booking.calloutFee) : "")}
      <p><strong>Grand Total: ${formatCurrency(booking.grandTotal)}</strong></p>

      ${renderEmailButton(dashboardUrl, "Open Dashboard", theme.primary)}
    `;

    return emailLayout(business, theme, content);
  },
},

  /* =====================================================
     DEPOSIT PAYMENT REQUEST — CUSTOMER
  ===================================================== */
  DEPOSIT_PAYMENT_REQUEST: {
  subject: (data) => {
    if ((Number(data.booking.depositAmount) || 0) > 0) {
      return `Deposit Required: ${data.business.name}`;
    }

    return `Booking Confirmed: ${data.business.name}`;
  },

  html: (data) => {
    const { business, theme, booking, manageUrl } = data;

    const hasDeposit = (Number(booking.depositAmount) || 0) > 0;

    const content = hasDeposit
      ? `
        <p>Hi ${booking.customerName},</p>

        <p>
          Your booking with <strong>${business.name}</strong> has been approved.
        </p>

        <p>
          A deposit of <strong>${formatCurrency(booking.depositAmount)}</strong> is required
          to secure your appointment.
        </p>

        <p>
          This deposit is part of the total service fee and will be deducted
          from the final amount.
        </p>

        ${renderManageSection({ manageUrl, theme })}

        <p>
          Open the booking page to pay the deposit and complete confirmation.
        </p>
      `
      : `
        <p>Hi ${booking.customerName},</p>

        <p>
          Your booking with <strong>${business.name}</strong> has been
          <strong>confirmed</strong>.
        </p>

        <p>
          No deposit is required. Your appointment is secured.
        </p>

        ${renderManageSection({ manageUrl, theme })}
      `;

    return emailLayout(business, theme, content);
  },
},

  BOOKING_CONFIRMED_NO_DEPOSIT: {
    subject: (data) =>
      `Booking Confirmed: ${data.business.name}`,

    html: (data) => {
      const { business, theme, booking, manageUrl } = data;

      const content = `
        <p>Hi ${booking.customerName},</p>

        <p>Your booking with <strong>${business.name}</strong> is now <strong>confirmed</strong>.</p>

        <p>
          Your current service total is <strong>${formatCurrency(booking.grandTotal)}</strong>.
          Prices are subject to change if anything is updated during the appointment.
        </p>

        ${renderInvoiceNotice(data)}
        ${renderManageSection(data)}
      `;

      return emailLayout(business, theme, content);
    },
  },

  /* =====================================================
     BOOKING CONFIRMED WITH DEPOSIT
  ===================================================== */
  BOOKING_CONFIRMED_WITH_DEPOSIT: {
    subject: (data) =>
      `Booking Confirmed: ${data.business.name}`,

    html: (data) => {
      const { business, theme, booking, manageUrl } = data;

      const content = `
        <p>Hi ${booking.customerName},</p>

        <p>Your deposit has been received and your booking is now confirmed.</p>

        <p>
          The deposit of <strong>${formatCurrency(booking.depositAmount)}</strong> is part of your service charge
          and has already been deducted from the balance due after the appointment.
        </p>

        <p>
          Funds are securely held until you mark the booking complete.
        </p>

        ${renderInvoiceNotice(data)}

        ${renderManageSection({ manageUrl, theme })}
      `;

      return emailLayout(business, theme, content);
    },
  },
BOOKING_REJECTED: {
  subject: () => `Booking Rejected`,

  html: (data) => {
    const { business, theme, booking, rescheduleUrl } = data;

    const content = `
      <p>Hi ${booking.customerName},</p>

      <p>
        Unfortunately your booking could not be accommodated.
      </p>

      ${
        booking.rejectionReason
          ? `<p><strong>Reason:</strong> ${booking.rejectionReason}</p>`
          : ""
      }

      ${renderManageSection({ manageUrl: rescheduleUrl || data.manageUrl, theme }, "Manage Booking")}
    `;

    return emailLayout(business, theme, content);
  },
},

BOOKING_RESCHEDULED: {
  subject: () => `Booking Rescheduled`,

  html: (data) => {
    const { business, theme, booking, manageUrl } = data;

    const content = `
      <p>Your appointment has been rescheduled.</p>

      <p><strong>New Date:</strong> ${booking.date}</p>
      <p><strong>New Time:</strong> ${booking.startTime}</p>
      ${renderManageSection({ manageUrl, theme })}
    `;

    return emailLayout(business, theme, content);
  },
},

DEPOSIT_RECEIVED: {
  subject: () => `Deposit Received`,

  html: (data) => {
    const { business, theme, booking, dashboardUrl } = data;

    const content = `
      <p>A deposit of <strong>${formatCurrency(booking.depositAmount)}</strong> has been received.</p>

      <p>
        Funds are securely held and will be released once the booking is marked complete.
      </p>

      ${renderEmailButton(dashboardUrl || `${process.env.APP_URL || "https://booking.lodday.com"}/dashboard`, "Open Dashboard", theme.primary)}
    `;

    return emailLayout(business, theme, content);
  },
},

MARK_BOOKING_COMPLETE_REMINDER: {
  subject: () => `Please Confirm Completion`,

  html: (data) => {
    const { business, theme, booking, completeUrl } = data;

    const content = `
      <p>Your appointment has ended.</p>

      <p>
        Please confirm completion so funds can be released.
      </p>

      <p>
        <a href="${completeUrl}" target="_blank">Mark Booking Complete</a>
      </p>
    `;

    return emailLayout(business, theme, content);
  },
},
  /* =====================================================
     APPOINTMENT REMINDER (GENERIC)
  ===================================================== */
  APPOINTMENT_REMINDER_24H: {
    subject: (data) =>
      `Reminder: Appointment Tomorrow at ${data.booking.startTime}`,

    html: (data) => {
      const { business, theme, booking, manageUrl } = data;

      const content = `
        <p>Hi ${booking.customerName},</p>

        <p>
          This is a reminder of your appointment with 
          <strong>${business.name}</strong> tomorrow at 
          <strong>${booking.startTime}</strong>.
        </p>

        <p>Please arrive on time.</p>
        ${renderManageSection({ manageUrl, theme })}
      `;

      return emailLayout(business, theme, content);
    },
  },

  /* =====================================================
     CHECK-IN WARNING (10 MINUTES BEFORE RELEASE)
  ===================================================== */
  CHECKIN_WARNING_10M: {
    subject: () => `Check-In Required — Your Slot May Be Released`,

    html: (data) => {
      const { business, theme, booking, checkInUrl } = data;

      const content = `
        <p>Hi ${booking.customerName},</p>

        <p>
          Your appointment is about to begin.
        </p>

        <p>
          If you do not check in within the grace period,
          your slot may be released to walk-ins.
          Grace period is 10 minutes after the scheduled start time.
        </p>

        <p>
          Check in here:
          <a href="${checkInUrl}" target="_blank">${checkInUrl}</a>
        </p>
      `;

      return emailLayout(business, theme, content);
    },
  },
  APPOINTMENT_REMINDER_1H: {
  subject: () => `Confirm your appointment`,

  html: (data) => {
    const { business, theme, booking, confirmUrl, cancelUrl, manageUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Hi ${booking.customerName},</p>

        <p>You have an appointment scheduled at <strong>${booking.startTime}</strong>.</p>
        <p>Please confirm if you will attend.</p>

        ${renderEmailButton(confirmUrl, "Confirm Appointment", theme.primary)}
        ${renderEmailButton(cancelUrl, "Cancel Appointment", "#DC2626")}
        ${renderManageSection({ manageUrl, theme })}
      `
    );
  },
},
APPOINTMENT_REMINDER_30M: {
  subject: () => `Action required: Confirm your appointment`,

  html: (data) => {
    const { business, theme, booking, confirmUrl, cancelUrl, manageUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Hi ${booking.customerName},</p>

        <p>Your appointment at <strong>${booking.startTime}</strong> is not yet confirmed.</p>
        <p>Please confirm to secure your slot.</p>

        ${renderEmailButton(confirmUrl, "Confirm Appointment", theme.primary)}
        ${renderEmailButton(cancelUrl, "Cancel Appointment", "#DC2626")}
        ${renderManageSection({ manageUrl, theme })}
      `
    );
  },
},

NO_SHOW_NOTICE: {
  subject: () => `No Show Recorded`,

  html: (data) => {
    const { business, theme, manageUrl } = data;

    return emailLayout(
      business,
      theme,
      `<p>Your booking was marked as no-show.</p>${renderManageSection({ manageUrl, theme })}`
    );
  },
},
REFUND_APPROVED: {
  subject: () => `Refund Processed`,

  html: (data) => {
    const { business, theme, booking } = data;

    return emailLayout(
      business,
      theme,
      `<p>Your refund of KES ${booking.depositAmount} has been processed.</p>`
    );
  },
},
REFUND_REJECTED: {
  subject: () => `Refund Rejected`,

  html: (data) => {
    const { business, theme, reason } = data;

    return emailLayout(
      business,
      theme,
      `<p>Your refund request was rejected.</p>
       <p>Reason: ${reason}</p>`
    );
  },
},
POST_APPOINTMENT_THANK_YOU: {
  subject: () => `Thank You for Choosing Us`,

  html: (data) => {
    const { business, theme, reviewUrl, rebookUrl, manageUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Thank you for your appointment.</p>

        <p>
          Leave a review:
          <a href="${reviewUrl}" target="_blank">Write Review</a>
        </p>

        <p>
          Rebook:
          <a href="${rebookUrl}" target="_blank">Book Again</a>
        </p>

        ${renderManageSection({ manageUrl, theme })}
      `
    );
  },
},
  /* =====================================================
     REFUND REQUESTED
  ===================================================== */
  REFUND_REQUESTED: {
    subject: () => `Refund Request Received`,

    html: (data) => {
      const { business, theme, booking } = data;

      const content = `
        <p>A refund request has been submitted for booking reference 
        <strong>${booking.bookingKey}</strong>.</p>

        <p>Amount: KES ${booking.depositAmount}</p>
      `;

      return emailLayout(business, theme, content);
    },
  },

  
TRIAL_STARTED: {
  subject: () => `Your Free Trial Has Started`,

  html: (data) => {
    const { business, theme, dashboardUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Hello ${business.name},</p>

        <p>
          Your 14-day free trial is now active and your business workspace is ready.
        </p>

        <p>
          Trial end date:
          <strong>${business.access.trialEndsAt?.toDateString()}</strong>
        </p>

        <p>
          You can start setting up services, managing availability, and accepting bookings right away.
        </p>

        ${renderEmailButton("https://booking.lodday.com/subscription", "Subscribe Now", theme.primary)}
        ${renderEmailButton(dashboardUrl, "Open Dashboard", theme.primary)}
      `
    );
  },
},
BOOKING_CONFIRMATION_CONFIRMED: {
  subject: () => `Appointment confirmed`,

  html: (data) => {
    const { business, theme, booking, manageUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Hi ${booking.customerName},</p>
        <p>Your appointment at <strong>${booking.startTime}</strong> has been confirmed.</p>
        <p>We look forward to seeing you.</p>
        ${renderManageSection({ manageUrl, theme })}
      `
    );
  },
},
BOOKING_CONFIRMATION_BUSINESS_ALERT_45M: {
  subject: () => `Booking not confirmed yet`,

  html: (data) => {
    const { business, theme, booking } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>A booking has not yet been confirmed by the client.</p>
        <p><strong>Time:</strong> ${booking.startTime}</p>
        <p><strong>Customer phone:</strong> ${booking.customerPhone}</p>
      `
    );
  },
},
BOOKING_CONFIRMATION_BUSINESS_ALERT_30M: {
  subject: () => `Urgent: booking still unconfirmed`,

  html: (data) => {
    const { business, theme, booking } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>The client has still not confirmed this booking.</p>
        <p><strong>Time:</strong> ${booking.startTime}</p>
        <p><strong>Customer phone:</strong> ${booking.customerPhone}</p>
      `
    );
  },
},
BUSINESS_WELCOME: {
  subject: () => `Welcome to Lodday`,

  html: (data) => {
    const { business, theme, dashboardUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Hello ${business.name},</p>

        <p>
          Welcome to Lodday. We are excited to help you run bookings, manage clients, and grow your business with less admin work.
        </p>

        <p>
          Your account is ready, and you can continue customizing your profile, services, and booking experience from your dashboard.
        </p>

        <p>
          When you are ready, publish your booking page and start accepting appointments online.
        </p>

        ${renderEmailButton(dashboardUrl, "Go to Dashboard", theme.primary)}
      `
    );
  },
},
  AFFILIATE_APPROVED: {
  subject: () => `You've been approved as a Lodday Affiliate`,

  html: (data) => {
    const dashboardUrl = data.dashboardUrl || "https://affiliates.lodday.com/dashboard";

    return `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
        <h2>You're approved as a Lodday Affiliate</h2>
        <p>Hello ${data.name},</p>
        <p>Your affiliate application has been approved.</p>
        <p><strong>Referral Code:</strong> ${data.referralCode}</p>
        <p><strong>Access Code:</strong> ${data.accessCode}</p>
        <p>You can access your dashboard here:</p>
        <p><a href="${dashboardUrl}" target="_blank" rel="noreferrer">${dashboardUrl}</a></p>
      </div>
    `;
  },
  },
  AFFILIATE_APPLICATION_RECEIVED: {
    subject: "Application Received – Lodday Affiliates",
    text: ({ name }: { name?: string }) =>
      [
        `Hello${name ? ` ${name}` : ""},`,
        "",
        "Your affiliate application has been received successfully.",
        "Our team is currently reviewing your details.",
        "You will receive an email once a decision has been made.",
        "Please allow 24 to 72 hours for review.",
        "",
        "Lodday Affiliates",
      ].join("\n"),
    html: ({ name }: { name?: string }) => `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Hello${name ? ` ${name}` : ""},</p>
        <p>Your affiliate application has been received successfully.</p>
        <p>Our team is currently reviewing your details.</p>
        <p>You will receive an email once a decision has been made.</p>
        <p>Please allow 24 to 72 hours for review.</p>
        <p>Lodday Affiliates</p>
      </div>
    `,
  },
  AFFILIATE_APPLICATION_REVIEW_ALERT: {
    subject: "New Affiliate Application – Action Required",
    text: ({
      name,
      email,
      phone,
      adminUrl,
    }: {
      name: string;
      email: string;
      phone: string;
      adminUrl: string;
    }) =>
      [
        "A new affiliate application has been submitted.",
        "",
        `Applicant Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        "",
        `Review in admin panel: ${adminUrl}`,
      ].join("\n"),
    html: ({
      name,
      email,
      phone,
      adminUrl,
    }: {
      name: string;
      email: string;
      phone: string;
      adminUrl: string;
    }) => `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>A new affiliate application has been submitted.</p>
        <p><strong>Applicant Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><a href="${adminUrl}">Review in admin panel</a></p>
      </div>
    `,
  },
  AFFILIATE_REJECTED: {
  subject: () => `Affiliate Application Update`,

  html: (data) => `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
      <h2>Affiliate Application Update</h2>
      <p>Hello ${data.name},</p>
      <p>Thank you for applying to the Lodday Affiliate Program.</p>
      <p>We reviewed your application and are unable to approve it at this time.</p>
      <p>You may apply again later if your information changes.</p>
    </div>
  `,
},
MARKETPLACE_REQUEST_RECEIVED: {
  subject: () => `Marketplace Request Received`,
  html: (data) => `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
      <h2>Marketplace Request Received</h2>
      <p>Hello ${data.businessName || "there"},</p>
      <p>Your marketplace visibility request has been received and is now under review.</p>
      <p>We will notify you once a decision has been made.</p>
    </div>
  `,
},
MARKETPLACE_REQUEST_ADMIN_ALERT: {
  subject: () => `New Marketplace Visibility Request`,
  html: (data) => `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
      <h2>New Marketplace Visibility Request</h2>
      <p><strong>Business:</strong> ${data.businessName}</p>
      <p><strong>Admin Panel:</strong> <a href="${data.adminUrl}">${data.adminUrl}</a></p>
    </div>
  `,
},
MARKETPLACE_APPROVED: {
  subject: () => `Marketplace Approved`,
  html: (data) => `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
      <h2>Marketplace Approved</h2>
      <p>Hello ${data.businessName || "there"},</p>
      <p>Your business is now visible on the Lodday Marketplace.</p>
      <p>You can manage marketplace visibility from your business dashboard.</p>
    </div>
  `,
},
MARKETPLACE_REJECTED: {
  subject: () => `Marketplace Request Update`,
  html: (data) => `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
      <h2>Marketplace Request Update</h2>
      <p>Hello ${data.businessName || "there"},</p>
      <p>Your marketplace visibility request was not approved at this time.</p>
      <p><strong>Reason:</strong> ${data.reason || "No reason provided."}</p>
      <p>Please update your business details and reapply from your dashboard.</p>
    </div>
  `,
},
TRIAL_EXPIRING: {
  subject: (data) =>
    `Your Trial Ends on ${data.business.access.trialEndsAt?.toDateString()}`,

  html: (data) => {
    const { business, theme, upgradeUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Hello ${business.name},</p>

        <p>
          Your trial ends on 
          <strong>${business.access.trialEndsAt?.toDateString()}</strong>.
        </p>

        <p>
          Upgrade now to continue accepting bookings without interruption.
        </p>

        ${renderEmailButton(upgradeUrl || "https://booking.lodday.com/subscription", "Upgrade Subscription", theme.primary)}
      `
    );
  },
},
TRIAL_EXPIRED: {
  subject: () => `Trial Ended — Booking Disabled`,

  html: (data) => {
    const { business, theme, upgradeUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Your trial has ended.</p>

        <p>
          Your public booking link is now disabled.
        </p>

        ${renderEmailButton(upgradeUrl || "https://booking.lodday.com/subscription", "Activate Plan", theme.primary)}
      `
    );
  },
},
SUBSCRIPTION_SUCCESS: {
  subject: () => `Subscription Activated`,

  html: (data) => {
    const { business, theme } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Your subscription is now active.</p>

        <p>
          Next charge date:
          <strong>${business.access.nextChargeAt?.toDateString()}</strong>
        </p>

        <p>
          Your public booking link is fully operational.
        </p>
      `
    );
  },
},
SUBSCRIPTION_RENEWED: {
  subject: () => `Subscription Renewed Successfully`,

  html: (data) => {
    const { business, theme } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Your subscription has been renewed.</p>

        <p>
          Next billing date:
          <strong>${business.access.nextChargeAt?.toDateString()}</strong>
        </p>
      `
    );
  },
},
SUBSCRIPTION_GRACE_WARNING: {
  subject: () => `Grace Period Ending Soon`,

  html: (data) => {
    const { business, theme, retryUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Your subscription is in grace period.</p>

        <p>
          Final reminder before booking access is disabled.
        </p>

        <p>
          <a href="${retryUrl}" target="_blank">Complete Payment</a>
        </p>
      `
    );
  },
},
SUBSCRIPTION_FAILED: {
  subject: () => `Payment Failed — Grace Period Started`,

  html: (data) => {
    const { business, theme, retryUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Your subscription payment failed.</p>

        <p>
          A 3-day grace period has started.
        </p>

        <p>
          If payment is not completed within 3 days,
          your booking link will be disabled.
        </p>

        <p>
          <a href="${retryUrl}" target="_blank">Retry Payment</a>
        </p>
      `
    );
  },
},
SUBSCRIPTION_EXPIRED: {
  subject: () => `Subscription Expired`,

  html: (data) => {
    const { business, theme, retryUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Your subscription has expired.</p>

        <p>
          Your public booking link is now disabled.
        </p>

        <p>
          Reactivate:
          <a href="${retryUrl}" target="_blank">Reactivate Plan</a>
        </p>
      `
    );
  },
},
INVOICE_REQUESTED_NOTIFICATION: {
  subject: () => `Invoice Requested by Customer`,
  html: (data) => {
    const { business, theme, booking, dashboardUrl } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>A customer has requested an invoice.</p>

        <p>Booking Reference: ${booking.bookingKey}</p>

        <p>
          Generate invoice:
          <a href="${dashboardUrl}" target="_blank">Create Invoice</a>
        </p>
      `
    );
  },
},
INVOICE_SENT_CUSTOMER: {
  subject: () => `Your Invoice`,
  html: (data) => {
    const { business, theme } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>Your invoice is attached to this email.</p>

        <p>
          Please review and proceed with payment if applicable.
        </p>
      `
    );
  },
},
INVOICE_REMINDER_BUSINESS: {
  subject: () => `Reminder: Invoice Not Yet Sent`,
  html: (data) => {
    const { business, theme } = data;

    return emailLayout(
      business,
      theme,
      `
        <p>You have a pending invoice request.</p>

        <p>Please generate and send it to avoid customer dissatisfaction.</p>
      `
    );
  },
},
DAILY_APPOINTMENT_SUMMARY: {
  subject: (data) =>
    `Tomorrow's Appointments (${data.bookings.length})`,

  html: (data) => {
    const { business, theme, bookings } = data;

    const list = bookings
      .map((booking: any) => {
        const mobileBlock =
          booking.isMobile && booking.customerLocation
            ? `<p><strong>Mobile:</strong> ${booking.customerLocation.address}</p>`
            : "";

        const depositBlock =
          booking.depositAmount > 0
            ? `<p>Deposit: KES ${booking.depositAmount}</p>`
            : "";

        return `
          <div style="margin-bottom:20px;">
            <p><strong>${booking.startTime} - ${booking.customerName}</strong></p>
            <p>Reference: ${booking.bookingKey}</p>
            ${mobileBlock}
            ${depositBlock}
            <p>Total: KES ${booking.grandTotal}</p>
          </div>
        `;
      })
      .join("");

    const content = `
      <p>Hello ${business.name},</p>

      <p>Here are your appointments for tomorrow:</p>

      ${list}

      <p>Prepare accordingly.</p>
    `;

    return emailLayout(business, theme, content);
  },
},
BUSINESS_10_MIN_ALERT: {
  subject: (data) =>
    `Upcoming Appointment: ${data.booking.customerName}`,

  html: (data) => {
    const { business, theme, booking } = data;

    const mobileBlock =
      booking.isMobile && booking.customerLocation
        ? `
          <p><strong>Mobile Appointment</strong></p>
          <p>Address: ${booking.customerLocation.address}</p>
        `
        : "";

    const content = `
      <p>Hello ${business.name},</p>

      <p>
        Appointment starting in 10 minutes.
      </p>

      <p><strong>Customer:</strong> ${booking.customerName}</p>
      <p><strong>Phone:</strong> 
        <a href="tel:${booking.customerPhone}">
          ${booking.customerPhone}
        </a>
      </p>

      ${
        booking.customerEmail
          ? `<p><strong>Email:</strong> ${booking.customerEmail}</p>`
          : ""
      }

      ${mobileBlock}

      <p><strong>Reference:</strong> ${booking.bookingKey}</p>
    `;

    return emailLayout(business, theme, content);
  },
},
STAFF_BOOKING_ASSIGNED: {
  subject: (data) =>
    `New Assignment: ${data.booking.date} ${data.booking.startTime}`,

  html: (data) => {
    const { business, theme, booking, staffName } = data;

    const servicesList = booking.services
      .map((s: any) => {
        const addOns =
          s.selectedAddOns?.length
            ? `<ul>
                ${s.selectedAddOns
                  .map(
                    (a: any) =>
                      `<li>Add-on: ${a.title} (+${a.durationMinutes} mins)</li>`
                      
                   )
                  .join("")}
               </ul>`
            : "";

        const tier =
          s.selectedTier
            ? `<p>Tier: ${s.selectedTier.label}</p>`
            : "";

        const sessions =
          s.selectedSessions?.length
            ? `<p>Sessions: ${s.selectedSessions
                .map((ss: any) => ss.sessions)
                .join(", ")}</p>`
            : "";

        const areas =
          s.selectedAreas?.length
            ? `<p>Areas: ${s.selectedAreas
                .map((ar: any) => ar.area)
                .join(", ")}</p>`
            : "";

        return `
          <div style="margin-bottom:15px;">
            <strong>${s.serviceName || s?.serviceId?.name || "Service"}</strong><br/>
            ${s.serviceDescription ? `<span style="color:#666;">${s.serviceDescription}</span><br/>` : ""}
            Duration: ${formatDuration(s.durationMinutes) || "Not set"}<br/>
            Price: ${formatBookingPrice(s)}
            ${tier}
            ${sessions}
            ${areas}
            ${addOns}
          </div>
        `;
      })
      .join("");

    const referenceImages =
      booking.customerReferenceImages?.length
        ? `
          <p><strong>Customer Reference Images:</strong></p>
          ${booking.customerReferenceImages
            .map(
              (img: any) =>
                `<img src="${img.url}" width="120" style="margin-right:5px;" />`
            )
            .join("")}
        `
        : "";

    const mobileBlock =
      booking.isMobile && booking.customerLocation
        ? `
          <p><strong>Mobile Appointment</strong></p>
          <p>Address: ${booking.customerLocation.address}</p>
          <p>Distance: ${booking.distanceKm?.toFixed(1)} km</p>
        `
        : "";

    const depositBlock =
      booking.depositAmount > 0
        ? `<p><strong>Deposit Held:</strong> KES ${booking.depositAmount}</p>`
        : "";

    const internalNote =
      booking.staffInternalNote
        ? `
          <div style="background:#f5f5f5;padding:10px;margin-top:10px;">
            <strong>Owner Note:</strong>
            <p>${booking.staffInternalNote}</p>
          </div>
        `
        : "";

    const content = `
      <p>Hello ${staffName},</p>

      <p>You have been assigned a new booking.</p>

      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>

      <p><strong>Customer:</strong> ${booking.customerName}</p>
      <p><strong>Phone:</strong> ${booking.customerPhone}</p>

      ${mobileBlock}

      <hr/>

      ${servicesList}

      ${referenceImages}

      <hr/>

      <p><strong>Total Duration:</strong> ${formatDuration(booking.totalDurationMinutes) || "Not set"}</p>
      <p><strong>Total Value:</strong> KES ${booking.grandTotal}</p>

      ${depositBlock}

      ${internalNote}

      <p><strong>Reference:</strong> ${booking.bookingKey}</p>
    `;

    return emailLayout(business, theme, content);
  },
},
};
