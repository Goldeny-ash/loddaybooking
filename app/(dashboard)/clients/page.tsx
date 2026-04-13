import type { CSSProperties } from "react";
import Booking from "@/lib/models/Booking";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import { getTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

function themeCardStyle() {
  return {
    borderColor: "var(--brand-primary-light)",
    background: "linear-gradient(180deg, #ffffff 0%, var(--brand-bg-soft) 100%)",
  };
}

export default async function ClientsPage() {
  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business) return null;

  const bookingsRaw = await Booking.find({ businessId: business._id })
    .populate({ path: "serviceId", strictPopulate: false })
    .populate({ path: "staffId", strictPopulate: false })
    .populate({ path: "assignedTo", strictPopulate: false })
    .lean();

  const bookings = bookingsRaw.map((booking: any) => ({
    ...booking,
    _id: booking._id?.toString?.() || String(booking._id || ""),
    serviceId:
      booking.serviceId && typeof booking.serviceId === "object" && booking.serviceId._id
        ? { ...booking.serviceId, _id: booking.serviceId._id.toString() }
        : booking.serviceId,
    staffId:
      booking.staffId && typeof booking.staffId === "object" && booking.staffId._id
        ? { ...booking.staffId, _id: booking.staffId._id.toString() }
        : booking.staffId,
    assignedTo:
      booking.assignedTo && typeof booking.assignedTo === "object" && booking.assignedTo._id
        ? { ...booking.assignedTo, _id: booking.assignedTo._id.toString() }
        : booking.assignedTo,
    services: (booking.services || []).map((service: any) => ({
      ...service,
      serviceId:
        typeof service?.serviceId === "string"
          ? service.serviceId
          : service?.serviceId?._id?.toString?.() || service?.serviceId?.toString?.() || service?.serviceId,
      serviceName: service?.serviceName || "Service",
    })),
  }));

  const theme = getTheme(business);

  return (
    <div
      className="space-y-6"
      style={
        {
          "--brand-primary": theme.primary,
          "--brand-primary-light": theme.primaryLight,
          "--brand-primary-dark": theme.primaryDark,
          "--brand-accent": theme.accent,
          "--brand-accent-light": theme.accentLight,
          "--brand-accent-dark": theme.accentDark,
          "--brand-bg-soft": theme.backgroundSoft,
        } as CSSProperties
      }
    >
      

      <ClientDashboard
        bookings={bookings}
        bookingUrl={`/b/${business.username}`}
      />
    </div>
  );
}
