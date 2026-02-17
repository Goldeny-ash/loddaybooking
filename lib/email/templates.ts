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
    subject: (data) =>
      `Booking Submitted: ${data.business.name}`,

    html: (data) => {
      const {
        business,
        theme,
        booking,
        manageUrl,
      }: {
        business: any;
        theme: BrandTheme;
        booking: any;
        manageUrl: string;
      } = data;

      const servicesList = booking.services
        .map(
          (s: any) =>
            `<li>${s.serviceName} - KES ${s.price}</li>`
        )
        .join("");

      const content = `
        <p>Hi ${booking.customerName},</p>

        <p>
          Your appointment request with 
          <strong>${business.name}</strong> 
          on <strong>${booking.date}</strong> 
          from <strong>${booking.startTime}</strong> 
          to <strong>${booking.endTime}</strong> 
          has been submitted and is 
          <strong>pending approval</strong>.
        </p>

        <p>Services booked:</p>

        <ul>${servicesList}</ul>

        <p>Subtotal: KES ${booking.subtotal}</p>
        <p>Discount: KES ${booking.discountAmount}</p>

        ${
          booking.isMobile
            ? `<p>Callout Fee: KES ${booking.calloutFee}</p>`
            : ""
        }

        <p>Deposit: KES ${booking.depositAmount}</p>
        <p><strong>Grand Total: KES ${booking.grandTotal}</strong></p>

        <p>
          Manage your booking: 
          <a href="${manageUrl}" target="_blank">
            ${manageUrl}
          </a>
        </p>

        <p>
          Thank you,<br/>
          ${business.name} Team
        </p>
      `;

      return emailLayout(business, theme, content);
    },
  },

  /* =====================================================
     NEW BOOKING — BUSINESS
  ===================================================== */
  NEW_BOOKING_BUSINESS: {
    subject: (data) =>
      `New Booking: ${data.booking.customerName}`,

    html: (data) => {
      const {
        business,
        theme,
        booking,
        dashboardUrl,
      }: {
        business: any;
        theme: BrandTheme;
        booking: any;
        dashboardUrl: string;
      } = data;

      const servicesList = booking.services
        .map(
          (s: any) =>
            `<li>${s.serviceName} - KES ${s.price}</li>`
        )
        .join("");

      const content = `
        <p>Hello ${business.name},</p>

        <p>
          A new booking has been submitted and is currently 
          <strong>pending approval</strong>.
        </p>

        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>Phone:</strong> ${booking.customerPhone}</p>
        ${
          booking.customerEmail
            ? `<p><strong>Email:</strong> ${booking.customerEmail}</p>`
            : ""
        }

        <p>
          <strong>Date:</strong> ${booking.date} <br/>
          <strong>Time:</strong> ${booking.startTime} - ${booking.endTime}
        </p>

        <p>Services:</p>
        <ul>${servicesList}</ul>

        <p>Subtotal: KES ${booking.subtotal}</p>
        <p>Discount: KES ${booking.discountAmount}</p>

        ${
          booking.isMobile
            ? `<p>Callout Fee: KES ${booking.calloutFee}</p>`
            : ""
        }

        <p><strong>Grand Total: KES ${booking.grandTotal}</strong></p>

        <p>
          Review booking:
          <a href="${dashboardUrl}" target="_blank">
            ${dashboardUrl}
          </a>
        </p>
      `;

      return emailLayout(business, theme, content);
    },
  },

  /* =====================================================
     TRIAL REMINDER
  ===================================================== */
  TRIAL_REMINDER: {
    subject: (data) =>
      `Your Lodday Trial Ends in ${data.daysLeft} Day${
        data.daysLeft > 1 ? "s" : ""
      }`,

    html: (data) => {
      const {
        business,
        theme,
        daysLeft,
        upgradeUrl,
      }: {
        business: any;
        theme: BrandTheme;
        daysLeft: number;
        upgradeUrl: string;
      } = data;

      const content = `
        <p>Hello ${business.name},</p>

        <p>
          Your Lodday trial will expire in 
          <strong>${daysLeft} day${
        daysLeft > 1 ? "s" : ""
      }</strong>.
        </p>

        <p>
          To continue accepting bookings without interruption,
          please upgrade your subscription.
        </p>

        <p>
          Upgrade here:
          <a href="${upgradeUrl}" target="_blank">
            ${upgradeUrl}
          </a>
        </p>

        <p>
          If you have any questions, contact support at 
          support@lodday.com.
        </p>
      `;

      return emailLayout(business, theme, content);
    },
  },

  /* =====================================================
     PROMO ANNOUNCEMENT
  ===================================================== */
  PROMO_ANNOUNCEMENT: {
    subject: (data) =>
      `${data.title} - Special Offer`,

    html: (data) => {
      const {
        business,
        theme,
        title,
        message,
        promoCode,
      }: {
        business: any;
        theme: BrandTheme;
        title: string;
        message: string;
        promoCode?: string;
      } = data;

      const content = `
        <p>Hello,</p>

        <h3>${title}</h3>

        <p>${message}</p>

        ${
          promoCode
            ? `
            <p>
              Use promo code:
              <strong>${promoCode}</strong>
            </p>
          `
            : ""
        }

        <p>
          Book now and enjoy this offer.
        </p>
      `;

      return emailLayout(business, theme, content);
    },
  },
};
