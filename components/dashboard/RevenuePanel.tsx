"use client";

import { Banknote } from "lucide-react";

interface RevenuePanelProps {
  bookings: any[];
  business: any;
  className?: string;
}

export default function RevenuePanel({
  bookings,
  business,
  className = "",
}: RevenuePanelProps) {
  const today = new Date().toDateString();

  // Today's bookings
  const todayBookings = bookings.filter(
    (b) => new Date(b.startTime).toDateString() === today
  );

  // Sum of service price + callout fee
  const revenue = todayBookings
    .filter((b) => b.status === "confirmed")
    .reduce(
      (sum, b) => sum + (b.serviceId?.price || 0) + (b.calloutFee || 0),
      0
    );

  // Sum of deposits
  const deposits = todayBookings
    .filter((b) => b.status === "confirmed" && b.depositAmount)
    .reduce((sum, b) => sum + b.depositAmount, 0);

  // Total revenue (optional: revenue + deposits)
  const totalRevenue = revenue + deposits;

  return (
    <div
      className={`rounded-xl shadow p-5 border ${className}`}
      style={{
        backgroundColor: "var(--brand-bg-soft)",
        borderColor: "var(--brand-primary)",
      }}
    >
      <h3
        className="font-semibold mb-3 flex items-center gap-2"
        style={{ color: "var(--brand-primary-dark)" }}
      >
        <Banknote style={{ color: "var(--brand-primary)" }} /> Revenue Today
      </h3>

      <p
        className="text-3xl font-bold"
        style={{ color: "var(--brand-primary-dark)" }}
      >
        KES {totalRevenue.toLocaleString()}
      </p>

      <p className="text-xs" style={{ color: "var(--brand-accent-dark)" }}>
        Based on scheduled services + deposits
      </p>
    </div>
  );
}
