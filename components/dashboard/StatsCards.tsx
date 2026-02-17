"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useRouter } from "next/navigation";

type Range = "today" | "week" | "month" | "all";

interface StatsPayload {
  bookings: number;
  revenue: number;
  noShows: number;
  depositsHeld: number;
  staff: number;
  services: number;
  trends: {
    bookings: number;
    revenue: number;
    noShows: number;
  };
}

export default function StatsCards({
  businessId,
}: {
  businessId: string;
}) {
  const router = useRouter();

  const [range, setRange] = useState<Range>("month");
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- Fetch unified stats ---------------- */

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const res = await fetch(
      `/api/dashboard/stats?businessId=${businessId}&range=${range}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    setStats(data);
    setLoading(false);
  }, [businessId, range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ---------------- Formatters ---------------- */

  const kes = useMemo(
    () =>
      new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0,
      }),
    []
  );

  /* ---------------- UI helpers ---------------- */

  function Trend({ value }: { value: number }) {
    if (value === 0) return null;

    return (
      <span
        className={`flex items-center text-xs ${
          value > 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {value > 0 ? (
          <ArrowUpRight size={14} />
        ) : (
          <ArrowDownRight size={14} />
        )}
        {Math.abs(value)}%
      </span>
    );
  }

  const cards = stats && [
    {
      label: "Bookings",
      value: stats.bookings,
      trend: stats.trends.bookings,
      onClick: () => router.push(`/dashboard/bookings?range=${range}`),
    },
    {
      label: "Revenue",
      value: kes.format(stats.revenue),
      trend: stats.trends.revenue,
      note: "Deposits collected",
      onClick: () => router.push("/dashboard/finance"),
    },
    {
      label: "No-show Rate",
      value: `${stats.noShows}%`,
      trend: stats.trends.noShows,
      onClick: () => router.push("/dashboard/bookings?status=no-show"),
    },
    {
      label: "Staff",
      value: stats.staff,
      onClick: () => router.push("/dashboard/staff"),
    },
    {
      label: "Services",
      value: stats.services,
      onClick: () => router.push("/dashboard/services"),
    },
  ];

  /* ---------------- Skeleton ---------------- */

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl animate-pulse"
            style={{ background: "var(--brand-bg-soft)" }}
          />
        ))}
      </div>
    );
  }

  /* ---------------- Render ---------------- */

  return (
    <div className="mb-6 space-y-3">
      {/* Range selector */}
      <div className="flex gap-2 text-xs">
        {(["today", "week", "month", "all"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded border ${
              r === range ? "bg-white font-medium" : ""
            }`}
            style={{ borderColor: "var(--brand-primary)" }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards && cards.map((c) => (
          <button
            key={c.label}
            onClick={c.onClick}
            className="p-4 rounded-xl shadow text-left hover:scale-[1.01] transition"
            style={{
              backgroundColor: "var(--brand-bg-soft)",
              border: "1px solid var(--brand-primary)",
            }}
          >
            <span
              className="text-xs"
              style={{ color: "var(--brand-accent-dark)" }}
            >
              {c.label}
            </span>

            <div className="flex items-center justify-between mt-1">
              <span
                className="text-xl font-bold"
                style={{ color: "var(--brand-primary-dark)" }}
              >
                {c.value}
              </span>

              {c.trend !== undefined && <Trend value={c.trend} />}
            </div>

            {c.note && (
              <p className="text-[10px] mt-1 opacity-70">{c.note}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
