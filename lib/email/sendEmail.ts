import { transporter } from "./transporter";
import { emailTemplates } from "./templates";

type TemplateKey = keyof typeof emailTemplates;

// Map each template to the correct alias
const templateAliasMap: Record<TemplateKey, string> = {
  BOOKING_RECEIVED_CUSTOMER: "bookings@lodday.com",
  NEW_BOOKING_BUSINESS: "bookings@lodday.com",

  TRIAL_REMINDER: "subscription@lodday.com",

  PROMO_ANNOUNCEMENT: "promo@lodday.com",
};

const displayNameMap: Record<TemplateKey, string> = {
  BOOKING_RECEIVED_CUSTOMER: "Lodday Bookings",
  NEW_BOOKING_BUSINESS: "Lodday Bookings",
  TRIAL_REMINDER: "Lodday Billing",
  PROMO_ANNOUNCEMENT: "Lodday Promotions",
};

export async function sendEmail(
  templateKey: TemplateKey,
  to: string,
  data: any
) {
  const template = emailTemplates[templateKey];

  if (!template) throw new Error("Template not found");

  const fromAlias =
    templateAliasMap[templateKey] || "notifications@lodday.com";

  const displayName =
    displayNameMap[templateKey] || "Lodday";

  return transporter.sendMail({
    from: `"${displayName}" <${fromAlias}>`,
    to,
    subject: template.subject(data),
    html: template.html(data),
  });
}
