"use client";

import { useState } from "react";
import BookingRow from "./BookingRow";
import { getTheme } from "@/lib/theme";
import BookingDetailsModal from "./BookingDetailsModal";
import { type DashboardBooking } from "./bookingDisplay";
import { hasBookingStarted } from "@/lib/booking/utils";

function shouldShowUpcomingBooking(booking: DashboardBooking) {
  const isUpcomingStatus = ["pending", "pendingDeposit", "confirmed", "unconfirmed"].includes(
    booking.status || ""
  );

  return isUpcomingStatus && !hasBookingStarted(booking.date, booking.startTime);
}

export default function UpcomingBookings({
  initialBookings = [],
  business,
}: {
  initialBookings?: DashboardBooking[];
  business: unknown;
}) {
  const theme = getTheme(business);
  const [selectedBooking, setSelectedBooking] = useState<DashboardBooking | null>(
    null
  );

  const [bookings, setBookings] = useState(
    initialBookings.filter(shouldShowUpcomingBooking)
  );

  const updateBooking = (updated: DashboardBooking) => {
    setBookings((prev) =>
        prev
          .map((b) => (b._id === updated._id ? updated : b))
          .filter(shouldShowUpcomingBooking)
    );
  };

  return (
    <>
      <div
        className="rounded-xl shadow p-4"
        style={{
          background: `linear-gradient(180deg, ${theme.backgroundSoft} 0%, #ffffff 24%, #ffffff 100%)`,
          border: `1px solid ${theme.primaryLight}`,
        }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.primaryDark }}>
          Upcoming Bookings
        </h2>

        <div className="divide-y">
          {bookings.length === 0 && (
            <p className="text-sm py-6 text-center" style={{ color: theme.accentDark }}>
              No upcoming bookings to review
            </p>
          )}

          {bookings.map((booking) => (
            <BookingRow
              key={booking._id}
              booking={booking}
              onUpdate={updateBooking}
              business={business}
              onOpenDetails={setSelectedBooking}
            />
          ))}
        </div>
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        business={business}
        onBookingUpdated={updateBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </>
  );
}
