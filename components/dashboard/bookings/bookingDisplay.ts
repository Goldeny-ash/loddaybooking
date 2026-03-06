export type BookingService = {
  serviceId?: string | { _id?: string; name?: string };
  serviceName?: string;
  serviceDescription?: string;
  serviceImage?: string;
  durationMinutes?: number;
  price?: number;
  selectedAddOns?: Array<{
    title?: string;
    durationMinutes?: number;
    price?: number;
  }>;
  selectedSessions?: Array<{
    sessions?: number;
    durationMinutes?: number;
    price?: number;
  }>;
  selectedAreas?: Array<{
    area?: string;
    min?: number;
    max?: number;
    price?: number;
  }>;
  selectedTier?: {
    label?: string;
    min?: number;
    max?: number;
    price?: number;
  } | null;
};

export type DashboardBooking = {
  _id: string;
  status?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
  serviceName?: string;
  serviceDescription?: string;
  serviceImage?: string;
  serviceId?: { name?: string };
  staffId?: { name?: string };
  assignedTo?: { _id?: string; name?: string; email?: string };
  assignedAt?: string | Date;
  staffInternalNote?: string;
  services?: BookingService[];
  customerReferenceImages?: Array<{ url?: string }>;
  subtotal?: number;
  grandTotal?: number;
  calloutFee?: number;
  depositAmount?: number;
  rejectionReason?: string;
};

export function resolveServiceNames(booking: DashboardBooking): string[] {
  const fromServices = (booking.services || [])
    .map((s) => s.serviceName || (typeof s.serviceId === "object" ? s.serviceId?.name : undefined))
    .filter((name): name is string => Boolean(name && name.trim()))
    .map((name) => name.trim());

  if (fromServices.length > 0) return fromServices;

  const fallback =
    booking.serviceId?.name || booking.serviceName || booking.serviceDescription;
  return fallback ? [fallback] : ["Service"];
}

export function resolvePrimaryServiceName(booking: DashboardBooking): string {
  return resolveServiceNames(booking)[0] || "Service";
}

export function getBookingTotal(booking: DashboardBooking): number {
  if (typeof booking.grandTotal === "number") return booking.grandTotal;
  if (typeof booking.subtotal === "number") {
    return booking.subtotal + (booking.calloutFee || 0);
  }

  const servicesTotal = (booking.services || []).reduce(
    (sum, s) => sum + (s.price || 0),
    0
  );
  return servicesTotal + (booking.calloutFee || 0);
}

export function getBookingImages(booking: DashboardBooking): string[] {
  const serviceImages = (booking.services || [])
    .map((s) => s.serviceImage)
    .filter((url): url is string => Boolean(url && url.trim()));

  const customerRefs = (booking.customerReferenceImages || [])
    .map((img) => img.url)
    .filter((url): url is string => Boolean(url && url.trim()));

  const combined = [...serviceImages, ...customerRefs];
  return [...new Set(combined)];
}
