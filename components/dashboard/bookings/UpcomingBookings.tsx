"use client";

import { useState } from "react";
import BookingRow from "./BookingRow";
import { getTheme } from "@/lib/theme";
import BookingDetailsModal from "./BookingDetailsModal";
import { type DashboardBooking } from "./bookingDisplay";

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
    initialBookings.filter(
      (b) => b.status === "pending" || b.status === "confirmed"
    )
  );

  const updateBooking = (updated: DashboardBooking) => {
    setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
  };

  return (
    <>
      <div
        className="rounded-xl shadow p-4"
        style={{
          backgroundColor: theme.backgroundSoft,
          border: `1px solid ${theme.primary}`,
        }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.primaryDark }}>
          Upcoming Bookings
        </h2>

        <div className="divide-y">
          {bookings.length === 0 && (
            <p className="text-sm py-6 text-center" style={{ color: theme.accentDark }}>
              No upcoming bookings
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
        onClose={() => setSelectedBooking(null)}
      />
    </>
  );
}
