type DepositPolicyLike = {
  enabled?: boolean;
  type?: "fixed" | "percent";
  value?: number;
};

type MobileSettingsLike = {
  enabled?: boolean;
  baseLocation?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
  calloutPolicy?: {
    type?: "fixed" | "per_km" | "zone" | null;
    baseFee?: number | null;
    perKmFee?: number | null;
  } | null;
} | null;

type CustomerLocationLike = {
  lat?: number | null;
  lng?: number | null;
} | null;

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

function toCoordinate(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function haversineDistanceKm(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(endLat - startLat);
  const lngDelta = toRadians(endLng - startLng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(startLat)) *
      Math.cos(toRadians(endLat)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function computeCalloutCharge(params: {
  mobileSettings?: MobileSettingsLike;
  customerLocation?: CustomerLocationLike;
}) {
  const mobileSettings = params.mobileSettings;
  const policy = mobileSettings?.calloutPolicy;

  if (!mobileSettings?.enabled || !policy?.type) {
    return {
      calloutFee: 0,
      distanceKm: null as number | null,
      calculationMode: "none" as const,
      pendingPreciseLocation: false,
    };
  }

  if (policy.type === "fixed") {
    return {
      calloutFee: Math.max(0, Math.round(Number(policy.baseFee || 0))),
      distanceKm: null,
      calculationMode: "fixed" as const,
      pendingPreciseLocation: false,
    };
  }

  if (policy.type === "per_km") {
    const originLat = toCoordinate(mobileSettings.baseLocation?.lat);
    const originLng = toCoordinate(mobileSettings.baseLocation?.lng);
    const destinationLat = toCoordinate(params.customerLocation?.lat);
    const destinationLng = toCoordinate(params.customerLocation?.lng);

    if (
      originLat === null ||
      originLng === null ||
      destinationLat === null ||
      destinationLng === null
    ) {
      return {
        calloutFee: 0,
        distanceKm: null,
        calculationMode: "per_km" as const,
        pendingPreciseLocation: true,
      };
    }

    const distanceKm = haversineDistanceKm(
      originLat,
      originLng,
      destinationLat,
      destinationLng
    );
    const roundedDistanceKm = Math.round(distanceKm * 10) / 10;
    const calloutFee = Math.max(
      0,
      Math.round(roundedDistanceKm * Math.max(0, Number(policy.perKmFee || 0)))
    );

    return {
      calloutFee,
      distanceKm: roundedDistanceKm,
      calculationMode: "per_km" as const,
      pendingPreciseLocation: false,
    };
  }

  return {
    calloutFee: 0,
    distanceKm: null,
    calculationMode: "none" as const,
    pendingPreciseLocation: false,
  };
}
