"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { X, CalendarDays, Clock3, StickyNote, User } from "lucide-react";
import { getTheme } from "@/lib/theme";
import { formatDuration } from "@/lib/utils/formatDuration";
import { formatBookingPriceMin } from "@/lib/utils/bookingPresentation";
import {
  type DashboardBooking,
  getBookingImages,
  getBookingTotal,
  resolveServiceNames,
} from "./bookingDisplay";

export default function BookingDetailsModal({
  booking,
  business,
  onClose,
}: {
  booking: DashboardBooking | null;
  business: unknown;
  onClose: () => void;
}) {
  if (!booking) return null;

  const theme = getTheme(business);
  const serviceNames = resolveServiceNames(booking);
  const images = getBookingImages(booking);
  const total =
    typeof booking.grandTotal === "number"
      ? booking.grandTotal
      : getBookingTotal(booking);

  return (
    <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm p-4 md:p-8">
      <div className="mx-auto h-full w-full max-w-4xl overflow-hidden rounded-3xl border bg-white shadow-2xl">
        <div
          className="flex items-start justify-between px-5 py-4 md:px-7 md:py-5 border-b"
          style={{
            background: `linear-gradient(120deg, ${theme.primaryLight}, ${theme.backgroundSoft})`,
            borderColor: theme.primaryLight,
          }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accentDark }}>
              Booking Details
            </p>
            <h3 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryDark }}>
              {booking.customerName || "Customer"}
            </h3>
            <p className="text-sm mt-1" style={{ color: theme.accentDark }}>
              {serviceNames.join(", ")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border p-2 transition hover:opacity-80"
            style={{ borderColor: theme.primaryLight, color: theme.primaryDark }}
            aria-label="Close booking details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-[calc(100%-92px)] overflow-y-auto px-5 py-5 md:px-7 md:py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InfoTile icon={<CalendarDays size={14} />} label="Date" value={booking.date || "-"} />
            <InfoTile
              icon={<Clock3 size={14} />}
              label="Time"
              value={`${booking.startTime || "--:--"}${booking.endTime ? ` - ${booking.endTime}` : ""}`}
            />
            <InfoTile icon={<User size={14} />} label="Status" value={booking.status || "-"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoTile
              icon={<User size={14} />}
              label="Assigned Staff"
              value={booking.assignedTo?.name || booking.staffId?.name || "Not assigned"}
            />
            <InfoTile
              icon={<Clock3 size={14} />}
              label="Assigned At"
              value={
                booking.assignedAt
                  ? new Date(booking.assignedAt).toLocaleString()
                  : "-"
              }
            />
          </div>


          <section className="rounded-2xl border p-4" style={{ borderColor: theme.primaryLight, backgroundColor: theme.backgroundSoft }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: theme.primaryDark }}>
              Services
            </h4>
            <div className="space-y-3">
              {(booking.services || []).length > 0 ? (
                (booking.services || []).map((service, idx) => (
                  <div key={`${service.serviceName || "service"}-${idx}`} className="rounded-xl border bg-white p-3" style={{ borderColor: theme.primaryLight }}>
                    <p className="font-semibold" style={{ color: theme.primaryDark }}>
                      {service.serviceName || (typeof service.serviceId === "object" ? service.serviceId?.name : "") || "Service"}
                    </p>
                    {service.serviceDescription && (
                      <p className="text-xs mt-1" style={{ color: theme.accentDark }}>
                        {service.serviceDescription}
                      </p>
                    )}
                    <p className="text-xs mt-2" style={{ color: theme.accentDark }}>
                      Duration: {formatDuration(service.durationMinutes) || "Not set"} | Price: {formatBookingPriceMin(service)}
                    </p>
                    {service.selectedTier?.label && (
                      <p className="text-xs mt-1" style={{ color: theme.accentDark }}>
                        Tier: {service.selectedTier.label}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: theme.accentDark }}>
                  {serviceNames.join(", ")}
                </p>
              )}
            </div>
          </section>

          {booking.note && (
            <section className="rounded-2xl border p-4 bg-white" style={{ borderColor: theme.primaryLight }}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: theme.primaryDark }}>
                <StickyNote size={14} />
                Customer Note
              </h4>
              <p className="text-sm leading-6" style={{ color: theme.accentDark }}>
                {booking.note}
              </p>
            </section>
          )}

          {booking.staffInternalNote && (
            <section className="rounded-2xl border p-4 bg-white" style={{ borderColor: theme.primaryLight }}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: theme.primaryDark }}>
                <StickyNote size={14} />
                Staff Note
              </h4>
              <p className="text-sm leading-6" style={{ color: theme.accentDark }}>
                {booking.staffInternalNote}
              </p>
            </section>
          )}

          {images.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold mb-3" style={{ color: theme.primaryDark }}>
                Reference Images
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative h-28 md:h-36 overflow-hidden rounded-xl border" style={{ borderColor: theme.primaryLight }}>
                    <Image src={url} alt="Reference image" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border p-4 bg-white" style={{ borderColor: theme.primaryLight }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: theme.accentDark }}>Total</span>
              <span className="font-bold text-lg" style={{ color: theme.primaryDark }}>
                KES {total.toLocaleString()}
              </span>
            </div>
            {booking.depositAmount ? (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span style={{ color: theme.accentDark }}>Deposit</span>
                <span className="font-semibold" style={{ color: theme.primary }}>
                  KES {booking.depositAmount.toLocaleString()}
                </span>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2.5" style={{ borderColor: "var(--brand-primary-light)" }}>
      <p className="text-[11px] uppercase tracking-wide opacity-70 flex items-center gap-1" style={{ color: "var(--brand-accent-dark)" }}>
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium mt-1" style={{ color: "var(--brand-primary-dark)" }}>
        {value}
      </p>
    </div>
  );
}
