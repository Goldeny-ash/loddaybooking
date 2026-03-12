type PriceLike = {
  price?: number | null;
};

type RangeLike = {
  min?: number | null;
  max?: number | null;
  price?: number | null;
};

type BookingPriceSource = {
  price?: number | null;
  grandTotal?: number | null;
  subtotal?: number | null;
  calloutFee?: number | null;
  serviceId?: { price?: number | null } | null;
  services?: Array<{ price?: number | null }> | null;
  priceRange?: {
    min?: number | null;
    max?: number | null;
  } | null;
  selectedTier?: RangeLike | null;
  selectedAreas?: RangeLike[] | null;
  selectedSessions?: PriceLike[] | null;
  selectedAddOns?: PriceLike[] | null;
};

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sumPrices(items?: PriceLike[] | null) {
  return (items || []).reduce((sum, item) => sum + toNumber(item?.price), 0);
}

function getRangeFromSelectedAreas(selectedAreas?: RangeLike[] | null) {
  if (!selectedAreas?.length) return null;

  const min = selectedAreas.reduce(
    (sum, area) => sum + toNumber(area?.min ?? area?.price),
    0
  );
  const max = selectedAreas.reduce(
    (sum, area) => sum + toNumber(area?.max ?? area?.min ?? area?.price),
    0
  );

  if (min <= 0 && max <= 0) return null;
  return { min, max: max > 0 ? max : min };
}

function getRangeFromSelectedTier(selectedTier?: RangeLike | null) {
  if (!selectedTier) return null;

  const min = toNumber(selectedTier.min ?? selectedTier.price);
  const max = toNumber(selectedTier.max ?? selectedTier.min ?? selectedTier.price);

  if (min <= 0 && max <= 0) return null;
  return { min, max: max > 0 ? max : min };
}

function getRangeFromPriceRange(priceRange?: { min?: number | null; max?: number | null } | null) {
  if (!priceRange) return null;

  const min = toNumber(priceRange.min);
  const max = toNumber(priceRange.max ?? priceRange.min);

  if (min <= 0 && max <= 0) return null;
  return { min, max: max > 0 ? max : min };
}

function getFixedPriceFromSelectedSessions(selectedSessions?: PriceLike[] | null) {
  if (!selectedSessions?.length) return null;
  const total = sumPrices(selectedSessions);
  return total > 0 ? total : null;
}

export function formatCurrency(value: unknown, currency = "KES") {
  const amount = toNumber(value);
  return `${currency} ${amount.toLocaleString()}`;
}

export function getDisplayPriceBounds(source: BookingPriceSource) {
  const addOnsTotal = sumPrices(source.selectedAddOns);

  const areasRange = getRangeFromSelectedAreas(source.selectedAreas);
  if (areasRange) {
    return {
      min: areasRange.min + addOnsTotal,
      max: areasRange.max + addOnsTotal,
    };
  }

  const tierRange = getRangeFromSelectedTier(source.selectedTier);
  if (tierRange) {
    return {
      min: tierRange.min + addOnsTotal,
      max: tierRange.max + addOnsTotal,
    };
  }

  const baseRange = getRangeFromPriceRange(source.priceRange);
  if (baseRange) {
    return {
      min: baseRange.min + addOnsTotal,
      max: baseRange.max + addOnsTotal,
    };
  }

  const selectedSessionPrice = getFixedPriceFromSelectedSessions(source.selectedSessions);
  if (selectedSessionPrice !== null) {
    return { min: selectedSessionPrice + addOnsTotal, max: selectedSessionPrice + addOnsTotal };
  }

  const exactPrice = toNumber(source.price);
  if (exactPrice > 0) {
    return { min: exactPrice, max: exactPrice };
  }

  return null;
}

export function formatBookingPrice(source: BookingPriceSource, currency = "KES") {
  const bounds = getDisplayPriceBounds(source);
  if (!bounds) return "Price on request";

  const min = Math.round(bounds.min);
  const max = Math.round(bounds.max);

  if (min === max) {
    return formatCurrency(min, currency);
  }

  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
}

export function formatBookingPriceMin(source: BookingPriceSource, currency = "KES") {
  const bounds = getDisplayPriceBounds(source);
  if (!bounds) return "Price on request";

  return formatCurrency(Math.round(bounds.min), currency);
}

export function getBookingRevenueValue(booking: BookingPriceSource) {
  if (typeof booking.grandTotal === "number" && Number.isFinite(booking.grandTotal)) {
    return booking.grandTotal;
  }

  if (typeof booking.subtotal === "number" && Number.isFinite(booking.subtotal)) {
    return booking.subtotal + toNumber(booking.calloutFee);
  }

  if (Array.isArray(booking.services) && booking.services.length > 0) {
    return booking.services.reduce((sum, service) => sum + toNumber(service?.price), 0);
  }

  return toNumber(booking.serviceId?.price);
}
