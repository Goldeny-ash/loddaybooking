"use client";

import { Clock } from "lucide-react";

export default function TodaysSchedule({
  bookings,
}: {
  bookings: any[];
  business: any;
}) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
const todays = bookings
  .filter(b => b.date === today && b.status === "confirmed")
  .slice(0, 5);


  return (
    <div className="rounded-xl shadow p-5" style={{ backgroundColor: "var(--brand-bg-soft)", border: "1px solid var(--brand-primary)" }}>
      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--brand-primary-dark)" }}>
        <Clock style={{ color: "var(--brand-primary)" }} /> Today’s Schedule
      </h3>

      {!todays.length && (
        <p className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
          No bookings today.
        </p>
      )}

      <ul className="space-y-2">
        {todays.map((b) => (
          <li key={b._id} className="flex justify-between text-sm border-b pb-2" style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}>
            <span>{b.serviceId?.name} — {b.staffId?.name}</span>
            <span>{new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
