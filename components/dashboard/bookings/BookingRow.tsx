"use client";

import BookingActions from "./BookingActions";
import BookingStatusBadge from "./BookingStatusBadge";
import { getTheme } from "@/lib/theme";

export default function BookingRow({
  booking,
  onUpdate,
  business,
}: {
  booking: any;
  onUpdate: (b: any) => void;
  business: any;
}) {
  const theme = getTheme(business);

  return (
    <div
      className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 px-3 border-b last:border-b-0"
      style={{ backgroundColor: theme.backgroundSoft }}
    >
      {/* -------- Customer & Booking Info -------- */}
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
            {booking.date} · {booking.startTime} – {booking.endTime}
          </p>
          <p className="text-sm" style={{ color: theme.accentDark }}>
            {booking.serviceId?.name || "Service"}{' '}
            {booking.staffId?.name ? `· ${booking.staffId?.name}` : ""}
          </p>
        </div>

        <div className="min-w-[120px]">
          {booking.depositAmount > 0 && (
            <p className="text-sm font-medium" style={{ color: theme.primary }}>
              Deposit: KES {booking.depositAmount}
            </p>
          )}
          {booking.rejectionReason && (
            <p className="text-sm text-red-600">
              Rejection reason: {booking.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* -------- Status & Actions -------- */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mt-3 md:mt-0">
        <BookingStatusBadge status={booking.status} business={business} />
        <BookingActions booking={booking} onUpdate={onUpdate} business={business} />
      </div>
    </div>
  );
}
