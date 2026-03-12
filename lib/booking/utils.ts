type DepositPolicyLike = {
  enabled?: boolean;
  type?: "fixed" | "percent";
  value?: number;
};

type ServiceDepositLike = {
  depositOverride?: DepositPolicyLike | null;
};

const DEFAULT_APP_URL = "https://booking.lodday.com";

export function getAppBaseUrl() {
  return (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, "");
}

export function buildManageBookingUrl(params: {
  username?: string | null;
  bookingId: string;
  token: string;
}) {
  const baseUrl = getAppBaseUrl();
  const username = String(params.username || "").trim();

  if (!username) {
    return `${baseUrl}/manage?bookingId=${params.bookingId}&token=${params.token}`;
  }

  return `${baseUrl}/b/${username}/manage?bookingId=${params.bookingId}&token=${params.token}`;
}

export function buildDashboardUrl() {
  return `${getAppBaseUrl()}/dashboard`;
}

export function computeDepositAmountForService(params: {
  servicePrice: number;
  service?: ServiceDepositLike | null;
  businessPolicy?: DepositPolicyLike | null;
}) {
  const servicePrice = Math.max(0, Number(params.servicePrice || 0));
  const serviceOverride = params.service?.depositOverride;
  const businessPolicy = params.businessPolicy;

  const activePolicy =
    serviceOverride?.enabled ? serviceOverride : businessPolicy?.enabled ? businessPolicy : null;

  if (!activePolicy) {
    return 0;
  }

  const rawValue = Number(activePolicy.value || 0);
  const computed =
    activePolicy.type === "percent" ? (servicePrice * rawValue) / 100 : rawValue;

  if (!Number.isFinite(computed) || computed <= 0) {
    return 0;
  }

  return Math.min(Math.round(computed), Math.round(servicePrice));
}

export function toComparableDateTime(date?: string, time?: string) {
  if (!date || !time) return Number.NaN;
  return new Date(`${date}T${time}:00`).getTime();
}

export function hasBookingStarted(date?: string, time?: string, now = new Date()) {
  const value = toComparableDateTime(date, time);
  if (!Number.isFinite(value)) return false;
  return value <= now.getTime();
}
