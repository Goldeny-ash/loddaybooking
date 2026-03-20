export const AFFILIATE_DASHBOARD_URL = "https://affiliates.lodday.com/dashboard";
export const AFFILIATE_ADMIN_URL = "https://admin.lodday.com/affiliates";

export function normalizeAffiliateEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeKenyanPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, "");

  if (digits.startsWith("+254")) {
    return `+254${digits.slice(4).replace(/\D/g, "")}`;
  }

  if (digits.startsWith("254")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+254${digits.slice(1)}`;
  }

  if (digits.startsWith("7") || digits.startsWith("1")) {
    return `+254${digits}`;
  }

  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function isValidKenyanPhone(value: string) {
  return /^\+254(7\d{8}|1\d{8})$/.test(normalizeKenyanPhone(value));
}

export function generateAffiliateCode(prefix: string, size = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = prefix.toUpperCase();

  for (let index = 0; index < size; index += 1) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }

  return output;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function sendAffiliateApplicationReceivedEmail(input: {
  email: string;
  name?: string;
}) {
  const { sendEmail } = await import("@/lib/email/sendEmail");

  return sendEmail(
    "AFFILIATE_APPLICATION_RECEIVED",
    {
      to: input.email,
    },
    {
      name: input.name,
    }
  );
}

export async function sendAffiliateApplicationReviewAlertEmail(input: {
  name: string;
  email: string;
  phone: string;
}) {
  const { sendEmail } = await import("@/lib/email/sendEmail");

  return sendEmail(
    "AFFILIATE_APPLICATION_REVIEW_ALERT",
    {
      to: "support@lodday.com",
    },
    {
      name: input.name,
      email: input.email,
      phone: input.phone,
      adminUrl: AFFILIATE_ADMIN_URL,
    }
  );
}

export async function sendAffiliateApprovalEmail(input: {
  email: string;
  name: string;
  referralCode: string;
  accessCode: string;
}) {
  const { sendEmail } = await import("@/lib/email/sendEmail");

  return sendEmail(
    "AFFILIATE_APPROVED",
    {
      to: input.email,
    },
    {
      name: input.name,
      referralCode: input.referralCode,
      accessCode: input.accessCode,
      dashboardUrl: AFFILIATE_DASHBOARD_URL,
    }
  );
}

export async function sendAffiliateRejectionEmail(input: {
  email: string;
  name: string;
}) {
  const { sendEmail } = await import("@/lib/email/sendEmail");

  return sendEmail(
    "AFFILIATE_REJECTED",
    {
      to: input.email,
    },
    {
      name: input.name,
    }
  );
}
