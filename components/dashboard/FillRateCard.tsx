"use client";

import { PieChart } from "lucide-react";

export default function FillRateCard({ bookings }: { bookings: any[] }) {
  const total = bookings.length;
  const approved = bookings.filter((b) => b.status === "approved").length;
  const rate = total ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="rounded-2xl shadow p-5 border" style={{ borderColor: "var(--brand-primary)", backgroundColor: "var(--brand-bg-soft)" }}>
      <h3 className="font-semibold flex items-center gap-2 mb-3" style={{ color: "var(--brand-primary-dark)" }}>
        <PieChart size={18} style={{ color: "var(--brand-primary)" }} /> Fill Rate
      </h3>

      <div className="flex items-end gap-3">
        <p className="text-4xl font-bold" style={{ color: "var(--brand-primary)" }}>{rate}%</p>
        <span className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
          {approved}/{total} bookings
        </span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${rate}%`, backgroundColor: "var(--brand-primary)" }} />
      </div>
    </div>
  );
}
