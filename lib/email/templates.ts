import { emailLayout } from "./layout";
import { BrandTheme } from "@/lib/theme";

type TemplateDefinition = {
  subject: (data: any) => string;
  html: (data: any) => string;
};

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

    const servicesList = booking.services
      .map((s: any) => {

        const tier = s.selectedTier
          ? `<p><strong>Tier:</strong> ${s.selectedTier.label} - KES ${s.selectedTier.price}</p>`
          : "";

        const addOns =
          s.selectedAddOns?.length
            ? `<ul>${s.selectedAddOns
                .map((a: any) => `<li>Add-on: ${a.title} - KES ${a.price}</li>`)
                .join("")}</ul>`
            : "";

        const sessions =
          s.selectedSessions?.length
            ? `<ul>${s.selectedSessions
                .map((ss: any) => `<li>${ss.sessions} Sessions - KES ${ss.price}</li>`)
                .join("")}</ul>`
            : "";

        const areas =
          s.selectedAreas?.length
            ? `<ul>${s.selectedAreas
                .map((ar: any) => `<li>${ar.area} - KES ${ar.price}</li>`)
                .join("")}</ul>`
            : "";

        const image =
          s.serviceImage
            ? `<img src="${s.serviceImage}" style="max-width:320px;border-radius:8px;margin-top:8px;" />`
            : "";

        const description =
          s.serviceDescription
            ? `<p style="color:#666;margin:4px 0;">${s.serviceDescription}</p>`
            : "";

        const serviceLabel =
          s.serviceName ||
          s?.serviceId?.name ||
          "Selected Service";

        return `
          <li style="margin-bottom:20px;">
            <strong>${serviceLabel}</strong>
            ${description}
            ${image}

            <p><strong>Price:</strong> KES ${s.price}</p>

            ${tier}
            ${addOns}
            ${sessions}
            ${areas}
          </li>
        `;
      })
      .join("");

    const mobileBlock =
      booking.isMobile && booking.customerLocation
        ? `
          <p><strong>Mobile Service</strong></p>
          <p>Service Address: ${booking.customerLocation.address}</p>
          <p>Distance: ${booking.distanceKm?.toFixed(1)} km</p>
        `
        : "";

    const statusText = isConfirmed
      ? `<p>Your appointment with <strong>${business.name}</strong> has been <strong>confirmed</strong>.</p>`
      : `<p>Your booking request with <strong>${business.name}</strong> has been submitted and is awaiting approval.</p>`;

    const button = `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top:25px;">
  <tr>
    <td align="center" bgcolor="${theme.primaryColor}" style="border-radius:6px;">
      <a href="${manageUrl}"
        style="
          display:inline-block;
          padding:12px 22px;
          font-weight:600;
          color:#ffffff;
          text-decoration:none;
          border-radius:6px;
          font-family:'Inria Serif', serif;
        ">
        Manage Booking
      </a>
    </td>
  </tr>
</table>
`;

    const content = `
      <p>Hi ${booking.customerName},</p>

      ${statusText}

      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>

      ${mobileBlock}

      <h4>Services Selected</h4>

      <ul style="list-style:none;padding:0;">
        ${servicesList}
      </ul>

      <p>Subtotal: KES ${booking.subtotal}</p>
      ${booking.calloutFee ? `<p>Callout Fee: KES ${booking.calloutFee}</p>` : ""}
      <p><strong>Grand Total: KES ${booking.grandTotal}</strong></p>

      ${
        booking.depositAmount > 0
          ? `
          <p>
            If approved, a deposit of <strong>KES ${booking.depositAmount}</strong> 
            will be required. This deposit is part of the total service cost.
          </p>
          <p>
            Funds are securely held by Lodday and cannot be withdrawn by the business
            until the booking is marked complete.
          </p>
        `
          : ""
      }

      ${button}
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

    const servicesList = booking.services
      .map((s: any) => {

        const image =
          s.serviceImage
            ? `<img src="${s.serviceImage}" style="max-width:320px;border-radius:8px;margin-top:8px;" />`
            : "";

        const description =
          s.serviceDescription
            ? `<p style="color:#666;margin:4px 0;">${s.serviceDescription}</p>`
            : "";

        const tier =
          s.selectedTier
            ? `<p><strong>Tier:</strong> ${s.selectedTier.label} - KES ${s.selectedTier.price}</p>`
            : "";

        const addOns =
          s.selectedAddOns?.length
            ? `<ul>${s.selectedAddOns
                .map((a: any) => `<li>Add-on: ${a.title} - KES ${a.price}</li>`)
                .join("")}</ul>`
            : "";

        const serviceLabel =
          s.serviceName ||
          s?.serviceId?.name ||
          "Selected Service";

        return `
          <li style="margin-bottom:20px;">
            <strong>${serviceLabel}</strong>
            ${description}
            ${image}

            <p><strong>Price:</strong> KES ${s.price}</p>

            ${tier}
            ${addOns}
          </li>
        `;
      })
      .join("");

    const mobileBlock =
      booking.isMobile && booking.customerLocation
        ? `
          <p><strong>Mobile Service</strong></p>
          <p>Address: ${booking.customerLocation.address}</p>
          <p>Distance: ${booking.distanceKm?.toFixed(1)} km</p>
        `
        : "";

    const statusText = isConfirmed
      ? `<p>A new booking has been <strong>automatically confirmed</strong>.</p>`
      : `<p>A new booking request has been submitted and is awaiting your approval.</p>`;

    const button = `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top:25px;">
  <tr>
    <td align="center" bgcolor="${theme.primaryColor}" style="border-radius:6px;">
      <a href="${dashboardUrl}"
        style="
          display:inline-block;
          padding:12px 22px;
          font-weight:600;
          color:#ffffff;
          text-decoration:none;
          border-radius:6px;
          font-family:'Inria Serif', serif;
        ">
        View Booking in Dashboard
      </a>
    </td>
  </tr>
</table>
`;

    const content = `
      <p>Hello ${business.name},</p>

      ${statusText}

      <p><strong>Customer:</strong> ${booking.customerName}</p>
      <p><strong>Reference:</strong> ${booking.bookingKey}</p>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>

      ${mobileBlock}

      <h4>Services Selected</h4>

      <ul style="list-style:none;padding:0;">
        ${servicesList}
      </ul>

      <p>Subtotal: KES ${booking.subtotal}</p>
      ${booking.calloutFee ? `<p>Callout Fee: KES ${booking.calloutFee}</p>` : ""}
      <p><strong>Grand Total: KES ${booking.grandTotal}</strong></p>

      ${button}
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
    const { business, theme, booking, paymentUrl } = data;

    const hasDeposit = (Number(booking.depositAmount) || 0) > 0;

    const button = `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top:20px;">
<tr>
<td align="center" bgcolor="${theme.primaryColor}" style="border-radius:6px;">
<a href="${paymentUrl}"
style="
display:inline-block;
padding:12px 22px;
font-weight:600;
color:#ffffff;
text-decoration:none;
border-radius:6px;
background-color:${theme.primaryColor};
font-family:'Inria Serif', serif;
">
${hasDeposit ? "Pay Deposit" : "View Booking"}
</a>
</td>
</tr>
</table>
`;

    const content = hasDeposit
      ? `
        <p>Hi ${booking.customerName},</p>

        <p>
          Your booking with <strong>${business.name}</strong> has been approved.
        </p>

        <p>
          A deposit of <strong>KES ${booking.depositAmount}</strong> is required
          to secure your appointment.
        </p>

        <p>
          This deposit is part of the total service fee and will be deducted
          from the final amount.
        </p>

        ${button}

        <p>
          Once the deposit is paid, your booking will be fully confirmed.
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

        ${button}
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
      const { business, theme, booking, calendarUrl } = data;

      const content = `
        <p>Hi ${booking.customerName},</p>

        <p>Your deposit has been received and your booking is now confirmed.</p>

        <p>
          Funds are securely held until you mark the booking complete.
        </p>

        <p>
          Add to calendar:
          <a href="${calendarUrl}" target="_blank">Add to Google Calendar</a>
        </p>

        <p>
          Please remember to mark the booking complete after your appointment
          so funds can be released.
        </p>
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

      <p>
        You may reschedule here:
        <a href="${rescheduleUrl}" target="_blank">${rescheduleUrl}</a>
      </p>
    `;

    return emailLayout(business, theme, content);
  },
},

BOOKING_RESCHEDULED: {
  subject: () => `Booking Rescheduled`,

  html: (data) => {
    const { business, theme, booking } = data;

    const content = `
      <p>Your appointment has been rescheduled.</p>

      <p><strong>New Date:</strong> ${booking.date}</p>
      <p><strong>New Time:</strong> ${booking.startTime}</p>
    `;

    return emailLayout(business, theme, content);
  },
},

DEPOSIT_RECEIVED: {
  subject: () => `Deposit Received`,

  html: (data) => {
    const { business, theme, booking } = data;

    const content = `
      <p>A deposit of <strong>KES ${booking.depositAmount}</strong> has been received.</p>

      <p>
        Funds are securely held and will be released once the booking is marked complete.
      </p>

      <p>Reference: ${booking.bookingKey}</p>
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
      const { business, theme, booking } = data;

      const content = `
        <p>Hi ${booking.customerName},</p>

        <p>
          This is a reminder of your appointment with 
          <strong>${business.name}</strong> tomorrow at 
          <strong>${booking.startTime}</strong>.
        </p>

        <p>Please arrive on time.</p>
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
  subject: () => `Appointment in 1 Hour`,

  html: (data) => {
    const { business, theme, booking } = data;

    return emailLayout(
      business,
      theme,
      `<p>Your appointment starts in 1 hour at ${booking.startTime}.</p>`
    );
  },
},
APPOINTMENT_REMINDER_30M: {
  subject: () => `Appointment in 30 Minutes`,

  html: (data) => {
    const { business, theme, booking } = data;

    return emailLayout(
      business,
      theme,
      `<p>Your appointment starts in 30 minutes. Please arrive on time.</p>`
    );
  },
},

SLOT_RELEASED_NOTICE: {
  subject: () => `Booking Released`,

  html: (data) => {
    const { business, theme } = data;

    return emailLayout(
      business,
      theme,
      `<p>Your slot was released due to no check-in within the grace period.</p>`
    );
  },
},

NO_SHOW_NOTICE: {
  subject: () => `No Show Recorded`,

  html: (data) => {
    const { business, theme } = data;

    return emailLayout(
      business,
      theme,
      `<p>Your booking was marked as no-show.</p>`
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
    const { business, theme, reviewUrl, rebookUrl } = data;

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

        <p>
          <a href="${upgradeUrl}" target="_blank">Upgrade Subscription</a>
        </p>
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

        <p>
          Subscribe to reactivate:
          <a href="${upgradeUrl}" target="_blank">Activate Plan</a>
        </p>
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
            Duration: ${s.durationMinutes} mins<br/>
            Price: KES ${s.price}
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

      <p><strong>Total Duration:</strong> ${booking.totalDurationMinutes} mins</p>
      <p><strong>Total Value:</strong> KES ${booking.grandTotal}</p>

      ${depositBlock}

      ${internalNote}

      <p><strong>Reference:</strong> ${booking.bookingKey}</p>
    `;

    return emailLayout(business, theme, content);
  },
},
};
