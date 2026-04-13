"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  clientCount,
}: {
  businessId: string;
  clientCount: number;
}) {
  const router = useRouter();
  const [range, setRange] = useState<Range>("month");
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- Fetch unified stats ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/dashboard/stats?businessId=${businessId}&range=${range}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setStats(null);
          setError(
            typeof data?.error === "string" ? data.error : "Failed to load stats"
          );
          return;
        }

        setStats(data);
      } catch {
        if (cancelled) return;
        setStats(null);
        setError("Failed to load stats");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [businessId, range]);

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
    },
    {
      label: "Revenue",
      value: kes.format(stats.revenue),
      trend: stats.trends.revenue,
      note: `Deposits collected: ${kes.format(stats.depositsHeld || 0)}`,
    },
    {
      label: "No-show Rate",
      value: `${stats.noShows}%`,
      trend: stats.trends.noShows,
    },
    {
      label: "Staff",
      value: stats.staff,
    },
    {
      label: "Services",
      value: stats.services,
    },
    {
      label: "Clients",
      value: clientCount,
      onClick: () => router.push("/clients"),
    },
  ];

  /* ---------------- Skeleton ---------------- */

  if (loading || !stats) {
    if (!loading && error) {
      return (
        <div
          className="mb-6 rounded-xl border px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--brand-bg-soft)",
            borderColor: "var(--brand-primary)",
            color: "var(--brand-primary-dark)",
          }}
        >
          {error}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {cards && cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={c.onClick}
            className="p-4 rounded-xl shadow text-left"
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
