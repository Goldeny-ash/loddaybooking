"use client";

import { Banknote } from "lucide-react";
import { getBookingRevenueValue } from "@/lib/utils/bookingPresentation";

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
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const kes = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  });

  const confirmedTodayBookings = bookings.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "completed") &&
      b.date === todayLocal
  );

  const serviceRevenueToday = confirmedTodayBookings.reduce((sum, booking) => {
    return sum + getBookingRevenueValue(booking);
  }, 0);

  const depositsCollectedToday = bookings.reduce((sum, booking) => {
    if (booking.status !== "confirmed") return sum;
    const deposit = booking.depositId;
    if (!deposit || deposit.status !== "PAID") return sum;
    const paidAt = deposit.paidAt ? new Date(deposit.paidAt) : null;
    if (!paidAt || Number.isNaN(paidAt.getTime())) return sum;
    if (paidAt < startOfDay || paidAt >= endOfDay) return sum;

    if (typeof deposit.grossAmount === "number" && deposit.grossAmount > 0) {
      return sum + deposit.grossAmount;
    }

    return sum + (booking.depositAmount || 0);
  }, 0);

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
        {kes.format(serviceRevenueToday)}
      </p>

      <p className="text-xs mt-1" style={{ color: "var(--brand-accent-dark)" }}>
       
      </p>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--brand-accent-dark)" }}>Deposits collected today</span>
          <span className="font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
            {kes.format(depositsCollectedToday)}
          </span>
        </div>

        
      </div>

      
    </div>
  );
}
