"use client";

import BookingActions from "./BookingActions";
import BookingStatusBadge from "./BookingStatusBadge";
import { getTheme } from "@/lib/theme";
import {
  type DashboardBooking,
  resolvePrimaryServiceName,
} from "./bookingDisplay";

export default function BookingRow({
  booking,
  onUpdate,
  business,
  onOpenDetails,
}: {
  booking: DashboardBooking;
  onUpdate: (b: DashboardBooking) => void;
  business: unknown;
  onOpenDetails?: (booking: DashboardBooking) => void;
}) {
  const theme = getTheme(business);

  return (
    <div
      role={onOpenDetails ? "button" : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      onClick={() => onOpenDetails?.(booking)}
      onKeyDown={(e) => {
        if (!onOpenDetails) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails(booking);
        }
      }}
      className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 px-3 border-b last:border-b-0"
      style={{
        backgroundColor: theme.backgroundSoft,
        cursor: onOpenDetails ? "pointer" : "default",
      }}
    >
      <div className="flex flex-col md:flex-row gap-4 flex-1">
        <div className="min-w-[200px]">
          <p className="font-medium" style={{ color: theme.primaryDark }}>
            {booking.customerName}
          </p>
          {booking.customerPhone && (
            <p className="text-sm" style={{ color: theme.accentDark }}>
              {booking.customerPhone}
            </p>
          )}
          {booking.customerEmail && (
            <p className="text-sm" style={{ color: theme.accentDark }}>
              {booking.customerEmail}
            </p>
          )}
        </div>

        <div className="min-w-[220px]">
          <p className="text-sm" style={{ color: theme.accentDark }}>
            {booking.date} · {booking.startTime} - {booking.endTime}
          </p>
          <p className="text-sm" style={{ color: theme.accentDark }}>
            {resolvePrimaryServiceName(booking)}
            {booking.staffId?.name ? ` · ${booking.staffId.name}` : ""}
          </p>
        </div>

        <div className="min-w-[120px]">
          {booking.depositAmount ? (
            <p className="text-sm font-medium" style={{ color: theme.primary }}>
              Deposit: KES {booking.depositAmount.toLocaleString()}
            </p>
          ) : null}
          {booking.rejectionReason && (
            <p className="text-sm text-red-600">
              Rejection reason: {booking.rejectionReason}
            </p>
          )}
        </div>
      </div>

      <div
        className="flex flex-col md:flex-row items-start md:items-center gap-3 mt-3 md:mt-0"
        onClick={(e) => e.stopPropagation()}
      >
        <BookingStatusBadge status={booking.status || "pending"} business={business} />
        <BookingActions booking={booking} onUpdate={onUpdate} business={business} />
      </div>
    </div>
  );
}
