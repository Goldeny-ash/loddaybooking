"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import BookingDetailsModal from "@/components/dashboard/bookings/BookingDetailsModal";
import {
  type DashboardBooking,
  resolvePrimaryServiceName,
} from "@/components/dashboard/bookings/bookingDisplay";
import { hasBookingStarted } from "@/lib/booking/utils";

export default function TodaysSchedule({
  bookings,
  business,
}: {
  bookings: DashboardBooking[];
  business: unknown;
}) {
  const [activeBooking, setActiveBooking] = useState<DashboardBooking | null>(null);
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const today = new Date();
  const todayLocal = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const todays = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            b.date === todayLocal &&
            b.status === "confirmed" &&
            !hasBookingStarted(b.date, b.startTime)
        )
        .sort((a, b) =>
          String(a.startTime || "").localeCompare(String(b.startTime || ""))
        ),
    [bookings, todayLocal]
  );

  return (
    <>
      <div
        className="rounded-xl shadow p-5"
        style={{
          backgroundColor: "var(--brand-bg-soft)",
          border: "1px solid var(--brand-primary)",
        }}
      >
        <h3
          className="font-semibold mb-4 flex items-center gap-2"
          style={{ color: "var(--brand-primary-dark)" }}
        >
          <Clock style={{ color: "var(--brand-primary)" }} />
          Today&apos;s Schedule
        </h3>

        {!todays.length && (
          <p className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
            No bookings today.
          </p>
        )}

        <div className="space-y-3">
          {todays.map((b) => (
            <div
              key={b._id}
              className="w-full rounded-xl p-4 text-left transition-transform hover:scale-[1.01]"
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "white",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveBooking(b)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {resolvePrimaryServiceName(b)}
                  </p>

                  <p className="text-xs opacity-90 truncate">
                    {b.customerName || "Customer"}
                  </p>

                  <div className="flex items-center gap-1 text-xs mt-1 opacity-90">
                    <Clock size={14} />
                    <span>
                      {b.startTime || "--:--"}
                      {b.endTime ? ` - ${b.endTime}` : ""}
                    </span>
                  </div>
                </div>

                <div className="rounded-full p-2" style={{ backgroundColor: "white" }}>
                  <Clock size={14} style={{ color: "var(--brand-primary)" }} />
                  <span className="sr-only">Open booking details</span>
                </div>
              </button>

              <button
                type="button"
                disabled={sendingFor === b._id}
                onClick={async () => {
                  try {
                    setSendingFor(b._id);
                    const res = await fetch(`/api/bookings/${b._id}/send-mark-complete-email`, {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to send email");
                    window.alert("Mark-complete email sent to customer.");
                  } catch (error) {
                    const message = error instanceof Error ? error.message : "Failed to send email";
                    window.alert(message);
                  } finally {
                    setSendingFor(null);
                  }
                }}
                className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold border border-white/30 bg-white/15 hover:bg-white/25 disabled:opacity-60"
              >
                {sendingFor === b._id ? "Sending..." : "Send Mark Complete Email"}
              </button>
            </div>
          ))}
        </div>
      </div>
      <BookingDetailsModal
        booking={activeBooking}
        business={business}
        onClose={() => setActiveBooking(null)}
      />
    </>
  );
}
