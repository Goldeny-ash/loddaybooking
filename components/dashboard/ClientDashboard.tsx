"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  CalendarClock,
  Gift,
  Mail,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import ClientStats, { type ClientStatItem } from "@/components/dashboard/ClientStats";

type BookingLike = {
  _id?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  date?: string;
  startTime?: string;
  grandTotal?: number;
  subtotal?: number;
  status?: string;
  source?: string;
  note?: string;
  staffInternalNote?: string;
  services?: Array<{
    serviceName?: string;
    price?: number;
  }>;
};

type SegmentKey =
  | "all"
  | "active"
  | "risk"
  | "vip"
  | "new"
  | "frequent"
  | "walkins";

type ClientProfile = {
  id: string;
  name: string;
  bookings: BookingLike[];
  visits: number;
  totalSpend: number;
  avgSpend: number;
  lastVisit: Date | null;
  firstVisit: Date | null;
  daysSinceLastVisit: number | null;
  lifecycle: "new" | "active" | "loyal" | "at_risk";
  reliability: "Reliable" | "Watch" | "Fragile";
  statusLabel: string;
  scoreLabel: string;
  scoreTone: "good" | "warn" | "danger";
  dueInDays: number | null;
  preferredDay: string;
  preferredTime: string;
  style: string;
  favoriteService: string;
  noShows: number;
  cancelled: number;
  walkInVisits: number;
  notes: string[];
  tags: string[];
  predictedAnnualValue: number;
  rewardReady: boolean;
  rewardsUnlocked: number;
  referralCode: string;
  referralsMade: number;
  earnedRewards: number;
};

const TAB_OPTIONS: Array<{ key: SegmentKey; label: string; icon: string }> = [
  { key: "all", label: "All Clients", icon: "All" },
  { key: "active", label: "Active", icon: "🟢" },
  { key: "risk", label: "At Risk", icon: "🔴" },
  { key: "vip", label: "Loyal", icon: "💎" },
 
  { key: "new", label: "New", icon: "🆕" },
];

function formatKes(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function parseBookingDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function diffInDays(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function daysAgoLabel(days: number | null) {
  if (days === null) return "No visits yet";
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function dueLabel(days: number | null) {
  if (days === null) return "Build history";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due in 1 day";
  return `Due in ${days} days`;
}

function getReadableTime(startTime?: string) {
  if (!startTime) return "Any time";
  const [hours, minutes] = startTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return startTime;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function makeReferralCode(name: string) {
  const clean = name.replace(/[^a-zA-Z0-9 ]/g, "").trim().split(/\s+/).slice(0, 2).join("");
  return `${clean.toUpperCase().slice(0, 8) || "CLIENT"}123`;
}

function statusTone(tone: ClientProfile["scoreTone"]) {
  if (tone === "good") {
    return {
      background: "rgba(34,197,94,0.14)",
      border: "rgba(34,197,94,0.28)",
      color: "#166534",
    };
  }
  if (tone === "warn") {
    return {
      background: "rgba(245,158,11,0.14)",
      border: "rgba(245,158,11,0.28)",
      color: "#b45309",
    };
  }
  return {
    background: "rgba(239,68,68,0.14)",
    border: "rgba(239,68,68,0.28)",
    color: "#b91c1c",
  };
}

function lifecycleTone(lifecycle: ClientProfile["lifecycle"]) {
  if (lifecycle === "loyal") return statusTone("good");
  if (lifecycle === "active") return statusTone("good");
  if (lifecycle === "new") return statusTone("warn");
  return statusTone("danger");
}

function buildClientProfiles(bookings: BookingLike[]) {
  const today = startOfToday();
  const grouped = new Map<string, BookingLike[]>();

  for (const booking of bookings) {
    const rawName = typeof booking.customerName === "string" ? booking.customerName.trim() : "";
    if (!rawName) continue;
    const key = rawName.toLowerCase();
    const list = grouped.get(key) || [];
    list.push(booking);
    grouped.set(key, list);
  }

  const profiles = Array.from(grouped.entries()).map(([key, clientBookings]) => {
    const sorted = [...clientBookings].sort((a, b) => {
      const aDate = parseBookingDate(a.date)?.getTime() || 0;
      const bDate = parseBookingDate(b.date)?.getTime() || 0;
      return bDate - aDate;
    });

    const datedBookings = sorted
      .map((booking) => ({ booking, parsed: parseBookingDate(booking.date) }))
      .filter((entry) => entry.parsed);

    const revenueBookings = sorted.filter((booking) =>
      ["confirmed", "completed"].includes((booking.status || "").toLowerCase())
    );
    const totalSpend = revenueBookings.reduce(
      (sum, booking) => sum + Number(booking.grandTotal || booking.subtotal || 0),
      0
    );
    const visits = revenueBookings.length || sorted.length;
    const avgSpend = visits ? totalSpend / visits : 0;

    const lastVisit = datedBookings[0]?.parsed || null;
    const firstVisit = datedBookings[datedBookings.length - 1]?.parsed || null;
    const daysSinceLastVisit = lastVisit ? diffInDays(lastVisit, today) : null;

    const noShows = sorted.filter((booking) => booking.status === "no_show").length;
    const cancelled = sorted.filter((booking) => booking.status === "cancelled").length;
    const walkInVisits = sorted.filter((booking) =>
      (booking.source || "").toLowerCase().includes("walk")
    ).length;

    const intervals = [];
    for (let index = 0; index < datedBookings.length - 1; index += 1) {
      const current = datedBookings[index]?.parsed;
      const next = datedBookings[index + 1]?.parsed;
      if (current && next) {
        intervals.push(Math.max(1, diffInDays(next, current)));
      }
    }
    const avgInterval =
      intervals.length > 0
        ? Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length)
        : 30;
    const dueInDays = lastVisit ? avgInterval - diffInDays(lastVisit, today) : null;

    const serviceCounts = new Map<string, number>();
    const weekdayCounts = new Map<string, number>();
    const timeCounts = new Map<string, number>();
    const notes = sorted
      .flatMap((booking) => [booking.note, booking.staffInternalNote])
      .map((note) => (typeof note === "string" ? note.trim() : ""))
      .filter(Boolean);

    for (const booking of sorted) {
      for (const service of booking.services || []) {
        const serviceName = service?.serviceName?.trim();
        if (serviceName) {
          serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1);
        }
      }

      const bookingDate = parseBookingDate(booking.date);
      if (bookingDate) {
        const weekday = bookingDate.toLocaleDateString("en-KE", { weekday: "long" });
        weekdayCounts.set(weekday, (weekdayCounts.get(weekday) || 0) + 1);
      }

      const readableTime = getReadableTime(booking.startTime);
      timeCounts.set(readableTime, (timeCounts.get(readableTime) || 0) + 1);
    }

    const favoriteService =
      [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Signature services";
    const preferredDay =
      [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Flexible";
    const preferredTime =
      [...timeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Any time";

    let lifecycle: ClientProfile["lifecycle"] = "active";
    if (daysSinceLastVisit === null || visits <= 2) lifecycle = "new";
    if (visits >= 5 && (daysSinceLastVisit ?? 0) <= 45) lifecycle = "loyal";
    if ((daysSinceLastVisit ?? 0) > Math.max(45, avgInterval + 14) || noShows > 0) lifecycle = "at_risk";

    let reliability: ClientProfile["reliability"] = "Reliable";
    let scoreToneValue: ClientProfile["scoreTone"] = "good";
    if (noShows > 0 || cancelled >= 2) {
      reliability = "Fragile";
      scoreToneValue = "danger";
    } else if (cancelled === 1 || (daysSinceLastVisit ?? 0) > 35) {
      reliability = "Watch";
      scoreToneValue = "warn";
    }

    const tags = [
      lifecycle === "loyal" ? "VIP" : null,
      lifecycle === "at_risk" ? "At Risk" : null,
      lifecycle === "active" ? "Active" : null,
      lifecycle === "new" ? "New" : null,
      visits >= 4 ? "Frequent" : null,
      walkInVisits > 0 ? "Walk-in" : null,
    ].filter(Boolean) as string[];

    return {
      id: key,
      name: sorted[0]?.customerName?.trim() || "Client",
      bookings: sorted,
      visits,
      totalSpend,
      avgSpend,
      lastVisit,
      firstVisit,
      daysSinceLastVisit,
      lifecycle,
      reliability,
      statusLabel:
        lifecycle === "loyal"
          ? "💎 Loyal"
          : lifecycle === "active"
            ? "🟢 Active"
            : lifecycle === "new"
              ? "🆕 New"
              : "🔴 At Risk",
      scoreLabel:
        reliability === "Reliable"
          ? "🟢 Reliable"
          : reliability === "Watch"
            ? "🟡 Watch"
            : "🔴 Fragile",
      scoreTone: scoreToneValue,
      dueInDays,
      preferredDay,
      preferredTime,
      style: favoriteService.toLowerCase().includes("gel")
        ? "Classic / Glossy"
        : favoriteService.toLowerCase().includes("braid")
          ? "Protective / Trendy"
          : favoriteService.toLowerCase().includes("facial")
            ? "Wellness / Ritual"
            : "Classic / Trendy",
      favoriteService,
      noShows,
      cancelled,
      walkInVisits,
      notes,
      tags,
      predictedAnnualValue: Math.round(avgSpend * Math.max(2, Math.min(visits, 6))),
      rewardReady: visits > 0 && visits % 5 === 0,
      rewardsUnlocked: Math.floor(visits / 5),
      referralCode: makeReferralCode(sorted[0]?.customerName || "Client"),
      referralsMade: Math.min(6, Math.floor(visits / 2)),
      earnedRewards: Math.min(1500, Math.floor(visits / 2) * 200),
    } satisfies ClientProfile;
  });

  const averageSpendAcrossClients =
    profiles.length > 0
      ? profiles.reduce((sum, client) => sum + client.totalSpend, 0) / profiles.length
      : 0;
  const vipThreshold = Math.max(10000, averageSpendAcrossClients * 1.5);

  return profiles
    .map((profile) => ({
      ...profile,
      tags:
        profile.totalSpend >= vipThreshold && !profile.tags.includes("VIP")
          ? [...profile.tags, "VIP"]
          : profile.tags,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);
}

function filterClients(clients: ClientProfile[], segment: SegmentKey, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return clients.filter((client) => {
    const matchesQuery =
      !normalizedQuery ||
      client.name.toLowerCase().includes(normalizedQuery) ||
      client.favoriteService.toLowerCase().includes(normalizedQuery);

    if (!matchesQuery) return false;

    if (segment === "all") return true;
    if (segment === "active") return client.lifecycle === "active" || client.lifecycle === "loyal";
    if (segment === "risk") return client.lifecycle === "at_risk";
    if (segment === "vip") return client.tags.includes("VIP") || client.lifecycle === "loyal";
    if (segment === "new") return client.lifecycle === "new";
    if (segment === "frequent") return client.visits >= 4;
    if (segment === "walkins") return client.walkInVisits > 0;

    return true;
  });
}

function CardShell({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border shadow-sm ${className}`}
      style={{
        borderColor: "var(--brand-primary-light)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, var(--brand-bg-soft) 100%)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function ClientDashboard({
  bookings,
  bookingUrl,
}: {
  bookings: BookingLike[];
  bookingUrl: string;
}) {
  const clients = useMemo(() => buildClientProfiles(bookings), [bookings]);
  const [segment, setSegment] = useState<SegmentKey>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [comebackClientId, setComebackClientId] = useState<string>("");
  const [rewardClientId, setRewardClientId] = useState<string>("");
  const [activityClientId, setActivityClientId] = useState<string>("");
  const [referralClientId, setReferralClientId] = useState<string>("");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [walkInDraft, setWalkInDraft] = useState({
    name: "",
    service: "",
    email: "",
  });

  const filteredClients = useMemo(
    () => filterClients(clients, segment, deferredSearch),
    [clients, segment, deferredSearch]
  );

  const selectedClient = clients.find((client) => client.id === selectedClientId) || null;
  const comebackClient = clients.find((client) => client.id === comebackClientId) || null;
  const rewardClient = clients.find((client) => client.id === rewardClientId) || null;
  const activityClient = clients.find((client) => client.id === activityClientId) || null;
  const referralClient = clients.find((client) => client.id === referralClientId) || null;

  const inactiveCount = clients.filter((client) => (client.daysSinceLastVisit ?? 0) > 45).length;
  const loyalClients = clients.filter((client) => client.lifecycle === "loyal");
  const activeClients = clients.filter((client) => client.lifecycle === "active");
  const atRiskClients = clients.filter((client) => client.lifecycle === "at_risk");
  const newClients = clients.filter((client) => client.visits === 1);

  const monthlyRevenueForReturningClient = (client: ClientProfile) =>
    Math.round(client.predictedAnnualValue / 12);

  const statsCards: ClientStatItem[] = [
    {
      key: "loyal",
      title: "Loyal Clients Revenue",
      
      countLabel: `${loyalClients.length} Clients`,
      revenueLabel: formatKes(
        loyalClients.reduce((sum, client) => sum + monthlyRevenueForReturningClient(client), 0)
      ),
      tone: "success",
      confidenceLabel: "High confidence",
      
 },
    {
      key: "active",
      title: "Active Clients Revenue",
      
      countLabel: `${activeClients.length} Clients`,
      revenueLabel: formatKes(
        activeClients.reduce((sum, client) => sum + monthlyRevenueForReturningClient(client), 0)
      ),
      tone: "warning",
      confidenceLabel: "Medium confidence",
      questionLabel: "What can I still capture?",
      onClick: () => setSegment("active"),
    },
    {
      key: "risk",
      title: "At Risk Revenue",
    
      countLabel: `${atRiskClients.length} Clients`,
      revenueLabel: formatKes(
        atRiskClients.reduce((sum, client) => sum + monthlyRevenueForReturningClient(client), 0)
      ),
      tone: "danger",
      confidenceLabel: "Low confidence",
      questionLabel: "What am I losing?",
      onClick: () => setSegment("risk"),
    },
    {
      key: "new",
      title: "New Clients Revenue",
      
      countLabel: `${newClients.length} Clients`,
      revenueLabel: formatKes(newClients.reduce((sum, client) => sum + client.totalSpend, 0)),
      tone: "neutral",
      confidenceLabel: "Unknown confidence",
      questionLabel: "What did new acquisition bring in?",
      onClick: () => setSegment("new"),
    },
  ];

  return (
    <section
      className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-4 sm:px-6 lg:px-8 xl:px-10"
      style={{ color: "var(--brand-primary-dark)" }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: "var(--brand-accent-dark)" }}
          >
            Client Dashboard
          </p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
            Your client dashboard
          </h2>
          <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--brand-accent-dark)" }}>
        
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCampaignOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}
          >
            <Mail size={16} />
            Send to Inactive Clients
          </button>
          <button
            type="button"
            onClick={() => setWalkInOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: "var(--brand-primary-light)",
              color: "var(--brand-primary-dark)",
              background: "#ffffff",
            }}
          >
            <Plus size={16} />
            Add Walk-in Client
          </button>
        </div>
      </div>

      <ClientStats items={statsCards} />

      <CardShell className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TAB_OPTIONS.map((tab) => {
              const active = segment === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSegment(tab.key)}
                  className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    borderColor: active ? "var(--brand-primary)" : "var(--brand-primary-light)",
                    background: active ? "var(--brand-primary)" : "rgba(255,255,255,0.72)",
                    color: active ? "#ffffff" : "var(--brand-primary-dark)",
                  }}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          <label
            className="flex items-center gap-3 rounded-full border px-4 py-3"
            style={{
              borderColor: "var(--brand-primary-light)",
              background: "rgba(255,255,255,0.78)",
            }}
          >
            <Search size={16} style={{ color: "var(--brand-accent-dark)" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or service"
              className="w-full min-w-[220px] bg-transparent text-sm outline-none"
            />
          </label>
        </div>
      </CardShell>

      <CardShell className="overflow-hidden">
        <div
          className="flex flex-col gap-3 border-b px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
          style={{ borderColor: "var(--brand-primary-light)" }}
        >
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
              Client List
            </h3>
            <p className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
              {filteredClients.length} clients in this segment
            </p>
          </div>
          <p className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
            Open any client to view their full profile in a popup.
          </p>
        </div>

        {filteredClients.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--brand-accent-dark)" }}>
            No clients match this segment yet.
          </div>
        ) : (
          <>
            <div className="grid gap-4 p-4 md:hidden">
              {filteredClients.map((client) => {
                const lifeTone = lifecycleTone(client.lifecycle);
                const primaryCategory = client.tags[0] || client.statusLabel;

                return (
                  <CardShell key={client.id} className="p-4">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedClientId(client.id)}
                          className="text-left text-base font-semibold"
                          style={{ color: "var(--brand-primary-dark)" }}
                        >
                          {client.name}
                        </button>
                        <p className="mt-1 text-sm font-medium" style={{ color: "var(--brand-accent-dark)" }}>
                          {primaryCategory}
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <Metric label="Visits" value={String(client.visits)} compact />
                        <Metric label="Total Spend" value={formatKes(client.totalSpend)} compact />
                        <Metric label="Last Visit" value={daysAgoLabel(client.daysSinceLastVisit)} compact />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                        className="rounded-full px-4 py-2 text-xs font-semibold text-white"
                        style={{ background: "var(--brand-primary)" }}
                      >
                        View Full Profile
                      </button>
                      <span
                        className="inline-flex w-fit rounded-full border px-3 py-2 text-xs font-semibold"
                        style={{
                          background: lifeTone.background,
                          borderColor: lifeTone.border,
                          color: lifeTone.color,
                        }}
                      >
                        {client.statusLabel}
                      </span>
                    </div>
                  </CardShell>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead style={{ background: "var(--brand-bg-soft)" }}>
                  <tr className="text-left" style={{ color: "var(--brand-accent-dark)" }}>
                    <th className="px-5 py-3 font-medium">Client Summary</th>
                    <th className="px-5 py-3 font-medium">Client Metrics</th>
                    <th className="px-5 py-3 font-medium">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const lifeTone = lifecycleTone(client.lifecycle);
                    const primaryCategory = client.tags[0] || client.statusLabel;

                    return (
                      <tr
                        key={client.id}
                        className="border-t"
                        style={{ borderColor: "rgba(148,163,184,0.18)" }}
                      >
                        <td className="px-5 py-4">
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedClientId(client.id)}
                              className="font-semibold text-left"
                              style={{ color: "var(--brand-primary-dark)" }}
                            >
                              {client.name}
                            </button>
                            <p className="mt-1 text-xs font-medium" style={{ color: "var(--brand-accent-dark)" }}>
                              {primaryCategory}
                            </p>
                            <span
                              className="mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                              style={{
                                background: lifeTone.background,
                                borderColor: lifeTone.border,
                                color: lifeTone.color,
                              }}
                            >
                              {client.statusLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="font-medium" style={{ color: "var(--brand-primary-dark)" }}>
                              {client.visits} visits
                            </p>
                            <p className="font-medium" style={{ color: "var(--brand-primary-dark)" }}>
                              {formatKes(client.totalSpend)}
                            </p>
                            <p className="text-xs" style={{ color: "var(--brand-accent-dark)" }}>
                              {daysAgoLabel(client.daysSinceLastVisit)}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedClientId(client.id)}
                              className="rounded-full border px-3 py-2 text-xs font-semibold"
                              style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
                            >
                              View Full Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardShell>

      {selectedClient ? (
        <ModalShell
          title={`${selectedClient.name} Profile`}
          onClose={() => setSelectedClientId("")}
          widthClassName="max-w-5xl"
        >
          <ClientProfileContent
            client={selectedClient}
            bookingUrl={bookingUrl}
            draftNotes={draftNotes}
            setDraftNotes={setDraftNotes}
            onComeback={() => setComebackClientId(selectedClient.id)}
            onReward={() => setRewardClientId(selectedClient.id)}
            onOpenActivities={() => setActivityClientId(selectedClient.id)}
            onReferral={() => setReferralClientId(selectedClient.id)}
          />
        </ModalShell>
      ) : null}

      {campaignOpen ? (
        <ModalShell title="Manual Campaign" onClose={() => setCampaignOpen(false)}>
          <div className="space-y-4">
            <InfoRow label="Segment" value={`${inactiveCount} inactive clients available`} />
            <select
              defaultValue="inactive"
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
              style={{ borderColor: "var(--brand-primary-light)" }}
            >
              <option value="inactive">Inactive clients</option>
              <option value="risk">At risk clients</option>
              <option value="reward">Reward-ready clients</option>
            </select>
            <textarea
              rows={5}
              defaultValue={`Hey there, we miss you. Your next slot is ready whenever you are. Book here: ${bookingUrl}\n\nTo stop receiving Lodday promotions, use the unsubscribe link in the footer.`}
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
              style={{ borderColor: "var(--brand-primary-light)" }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCampaignOpen(false)}
                className="rounded-full border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setCampaignOpen(false)}
                className="rounded-full px-4 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--brand-primary)" }}
              >
                Send
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {comebackClient ? (
        <ModalShell
          title={`Comeback Email - ${comebackClient.name}`}
          onClose={() => setComebackClientId("")}
        >
          <div className="space-y-4">
            <textarea
              rows={5}
              defaultValue={`Hey 👋 we miss you!\nBook your next session here: ${bookingUrl}\n\nTo stop receiving Lodday promotions, use the unsubscribe link in the footer.`}
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
              style={{ borderColor: "var(--brand-primary-light)" }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComebackClientId("")}
                className="rounded-full border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
              >
                Edit Template
              </button>
              <button
                type="button"
                onClick={() => setComebackClientId("")}
                className="rounded-full px-4 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--brand-primary)" }}
              >
                Send
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {activityClient ? (
        <ModalShell
          title={`${activityClient.name} Activity`}
          onClose={() => setActivityClientId("")}
          widthClassName="max-w-3xl"
        >
          <AllActivityList client={activityClient} />
        </ModalShell>
      ) : null}

      {rewardClient ? (
        <ModalShell
          title={`Reward Offer - ${rewardClient.name}`}
          onClose={() => setRewardClientId("")}
        >
          <RewardOfferForm client={rewardClient} bookingUrl={bookingUrl} onClose={() => setRewardClientId("")} />
        </ModalShell>
      ) : null}

      {referralClient ? (
        <ModalShell
          title={`Referral Email - ${referralClient.name}`}
          onClose={() => setReferralClientId("")}
        >
          <ReferralEmailForm client={referralClient} bookingUrl={bookingUrl} onClose={() => setReferralClientId("")} />
        </ModalShell>
      ) : null}

      {walkInOpen ? (
        <ModalShell title="Add Walk-in Client" onClose={() => setWalkInOpen(false)}>
          <div className="space-y-4">
            <input
              value={walkInDraft.name}
              onChange={(event) => setWalkInDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Name"
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
              style={{ borderColor: "var(--brand-primary-light)" }}
            />
            <input
              placeholder="Phone"
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
              style={{ borderColor: "var(--brand-primary-light)" }}
            />
            <input
              value={walkInDraft.service}
              onChange={(event) => setWalkInDraft((current) => ({ ...current, service: event.target.value }))}
              placeholder="Service"
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
              style={{ borderColor: "var(--brand-primary-light)" }}
            />
            <input
              value={walkInDraft.email}
              onChange={(event) => setWalkInDraft((current) => ({ ...current, email: event.target.value }))}
              placeholder="Optional email"
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
              style={{ borderColor: "var(--brand-primary-light)" }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWalkInOpen(false)}
                className="rounded-full border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
              >
                Close
              </button>
              <a
                href={`${bookingUrl}?source=walk_in`}
                className="rounded-full px-4 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--brand-primary)" }}
              >
                Send Booking Link
              </a>
            </div>
          </div>
        </ModalShell>
      ) : null}

     
    </section>
  );
}

function Metric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border ${compact ? "p-3" : "p-3.5"}`}
      style={{ borderColor: "var(--brand-primary-light)", background: "var(--brand-bg-soft)" }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--brand-accent-dark)" }}>
        {label}
      </p>
      <p className="mt-1 font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  label,
  icon,
  onClick,
  href,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold";
  const style = {
    borderColor: "var(--brand-primary-light)",
    color: "var(--brand-primary-dark)",
    background: "#ffffff",
  };

  if (href) {
    return (
      <a href={href} className={className} style={style}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {icon}
      {label}
    </button>
  );
}

function InsightPanel({
  title,
  icon,
  lines,
}: {
  title: string;
  icon: React.ReactNode;
  lines: string[];
}) {
  return (
    <CardShell className="p-4">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--brand-primary)" }}>{icon}</span>
        <h4 className="font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
          {title}
        </h4>
      </div>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <p key={line} className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
            {line}
          </p>
        ))}
      </div>
    </CardShell>
  );
}

function ClientProfileContent({
  client,
  bookingUrl,
  draftNotes,
  setDraftNotes,
  onComeback,
  onReward,
  onOpenActivities,
  onReferral,
}: {
  client: ClientProfile;
  bookingUrl: string;
  draftNotes: Record<string, string>;
  setDraftNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onComeback: () => void;
  onReward: () => void;
  onOpenActivities: () => void;
  onReferral: () => void;
}) {
  return (
    <div className="space-y-5">
      <div
        className="flex flex-col gap-4 rounded-[1.5rem] border p-4 sm:p-5"
        style={{
          borderColor: "var(--brand-primary-light)",
          background: "rgba(255,255,255,0.78)",
        }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--brand-accent-dark)" }}>
              Client Summary
            </p>
            <h3 className="mt-2 text-2xl font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
              {client.name}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {client.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)", background: "var(--brand-bg-soft)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Metric label="Total Spend" value={formatKes(client.totalSpend)} />
              <Metric label="Last Visit" value={daysAgoLabel(client.daysSinceLastVisit)} />
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Metric label="Visits" value={String(client.visits)} />
            <Metric label="Predictable Value" value={`${formatKes(client.predictedAnnualValue)}/year`} />
            <Metric label="Rewards Used" value={String(client.rewardsUnlocked)} />
            <Metric label="Average Spend" value={formatKes(client.avgSpend)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <QuickAction label="Send Comeback Email" icon={<Mail size={14} />} onClick={onComeback} />
          <QuickAction label="Book for Client" icon={<CalendarClock size={14} />} href={bookingUrl} />
        </div>
      </div>

      <CardShell className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--brand-accent-dark)" }}>
          Recent Activity
        </p>
        <div className="mt-4 space-y-3">
          {client.bookings.slice(0, 2).map((booking) => (
            <div
              key={booking._id || `${client.id}-${booking.date}-${booking.startTime}`}
              className="rounded-2xl border p-3"
              style={{
                borderColor: "var(--brand-primary-light)",
                background: "rgba(255,255,255,0.74)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium" style={{ color: "var(--brand-primary-dark)" }}>
                    {(booking.services || []).map((service) => service.serviceName).filter(Boolean).join(", ") || "Booking"}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--brand-accent-dark)" }}>
                    {booking.date || "No date"} at {getReadableTime(booking.startTime)}
                  </p>
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)", background: "var(--brand-bg-soft)" }}
                >
                  {(booking.status || "pending").replace(/_/g, " ")}
                </span>
              </div>
              {booking.note || booking.staffInternalNote ? (
                <p className="mt-2 text-sm" style={{ color: "var(--brand-accent-dark)" }}>
                  {booking.staffInternalNote || booking.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        {client.bookings.length > 2 ? (
          <button
            type="button"
            onClick={onOpenActivities}
            className="mt-4 rounded-full border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
          >
            See More
          </button>
        ) : null}
      </CardShell>

      <div className="grid gap-4 md:grid-cols-2">
        <CardShell className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--brand-accent-dark)" }}>
                Rewards
              </p>
              <h4 className="mt-2 text-lg font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
                {client.rewardReady
                  ? "Ready to reward now"
                  : `${Math.max(0, 5 - (client.visits % 5 || 5))} visits to next reward`}
              </h4>
            </div>
            <Gift size={18} style={{ color: "var(--brand-primary)" }} />
          </div>
          <button
            type="button"
            onClick={onReward}
            className="mt-4 rounded-full px-4 py-3 text-sm font-semibold text-white"
            style={{ background: "var(--brand-primary)" }}
          >
            Send Reward Offer
          </button>
        </CardShell>

        <CardShell className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--brand-accent-dark)" }}>
                Referrals
              </p>
              <h4 className="mt-2 text-lg font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
                {formatKes(client.earnedRewards)} earned
              </h4>
            </div>
            <UserPlus size={18} style={{ color: "var(--brand-primary)" }} />
          </div>
          <p className="mt-3 text-sm" style={{ color: "var(--brand-accent-dark)" }}>
            {client.referralsMade} referrals made
          </p>
          <p className="mt-2 text-sm font-medium" style={{ color: "var(--brand-primary-dark)" }}>
            Code: {client.referralCode}
          </p>
          <button
            type="button"
            onClick={onReferral}
            className="mt-4 rounded-full border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
          >
            Send Referral Email
          </button>
        </CardShell>
      </div>

      <CardShell className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--brand-accent-dark)" }}>
          Notes
        </p>
        <textarea
          value={draftNotes[client.id] ?? client.notes.join("\n")}
          onChange={(event) =>
            setDraftNotes((current) => ({ ...current, [client.id]: event.target.value }))
          }
          rows={4}
          className="mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
          style={{
            borderColor: "var(--brand-primary-light)",
            background: "rgba(255,255,255,0.74)",
            color: "var(--brand-primary-dark)",
          }}
          placeholder="Add a short note about preferences or service habits"
        />
      </CardShell>
    </div>
  );
}

function buildOfferCode(name: string, prefix: string) {
  const base = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "CLIENT";
  return `${prefix}-${base}-${new Date().getFullYear()}`;
}

function AllActivityList({ client }: { client: ClientProfile }) {
  return (
    <div className="space-y-3">
      {client.bookings.map((booking) => (
        <div
          key={booking._id || `${client.id}-${booking.date}-${booking.startTime}`}
          className="rounded-2xl border p-4"
          style={{
            borderColor: "var(--brand-primary-light)",
            background: "rgba(255,255,255,0.74)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium" style={{ color: "var(--brand-primary-dark)" }}>
                {(booking.services || []).map((service) => service.serviceName).filter(Boolean).join(", ") || "Booking"}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--brand-accent-dark)" }}>
                {booking.date || "No date"} at {getReadableTime(booking.startTime)}
              </p>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)", background: "var(--brand-bg-soft)" }}
            >
              {(booking.status || "pending").replace(/_/g, " ")}
            </span>
          </div>
          {booking.note || booking.staffInternalNote ? (
            <p className="mt-2 text-sm" style={{ color: "var(--brand-accent-dark)" }}>
              {booking.staffInternalNote || booking.note}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RewardOfferForm({
  client,
  bookingUrl,
  onClose,
}: {
  client: ClientProfile;
  bookingUrl: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(`${client.name} Loyalty Reward`);
  const [type, setType] = useState<"fixed" | "percent">("fixed");
  const [value, setValue] = useState(500);
  const [code, setCode] = useState(buildOfferCode(client.name, "REWARD"));
  const [message, setMessage] = useState(
    `Hi ${client.name},\n\nYou have unlocked a reward on your next visit. Use code ${buildOfferCode(client.name, "REWARD")} when booking here: ${bookingUrl}\n\nThis code is intended for one redemption.\n\nTo stop receiving Lodday promotions, use the unsubscribe link in the footer.`
  );

  return (
    <div className="space-y-4">
      <InfoRow label="Client" value={client.name} />
      <InfoRow label="Booking Link" value={bookingUrl} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Reward Name</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--brand-primary-light)" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Discount Type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as "fixed" | "percent")}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--brand-primary-light)" }}
          >
            <option value="fixed">Fixed amount</option>
            <option value="percent">Percentage</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Discount Value</label>
          <input
            type="number"
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--brand-primary-light)" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Single-use Code</label>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--brand-primary-light)" }}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--brand-accent-dark)" }}>
            Suggested automatically. Backend uniqueness validation still needs to enforce one-time redemption.
          </p>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email Message</label>
        <textarea
          rows={7}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
          style={{ borderColor: "var(--brand-primary-light)" }}
        />
      </div>
      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--brand-primary-light)", background: "var(--brand-bg-soft)" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--brand-accent-dark)" }}>
          Preview
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--brand-primary-dark)" }}>
          {title} - {type === "fixed" ? formatKes(value) : `${value}%`} off with code {code}.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
        >
          Close
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-3 text-sm font-semibold text-white"
          style={{ background: "var(--brand-primary)" }}
        >
          Save Reward Draft
        </button>
      </div>
    </div>
  );
}

function ReferralEmailForm({
  client,
  bookingUrl,
  onClose,
}: {
  client: ClientProfile;
  bookingUrl: string;
  onClose: () => void;
}) {
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("percent");
  const [discountValue, setDiscountValue] = useState(10);
  const [autoSend, setAutoSend] = useState(false);
  const [cadence, setCadence] = useState("1 month");
  const [message, setMessage] = useState(
    `Hi ${client.name},\n\nShare your referral code ${client.referralCode} with a friend when they book at ${bookingUrl}.\nBoth of you will get a discount on your next appointment once the code is used.\n\nIf you prefer not to receive Lodday promotions, use the unsubscribe link in the email footer.`
  );

  return (
    <div className="space-y-4">
      <InfoRow label="Client" value={client.name} />
      <InfoRow label="Referral Code" value={client.referralCode} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Discount Type</label>
          <select
            value={discountType}
            onChange={(event) => setDiscountType(event.target.value as "fixed" | "percent")}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--brand-primary-light)" }}
          >
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Discount Value</label>
          <input
            type="number"
            value={discountValue}
            onChange={(event) => setDiscountValue(Number(event.target.value))}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--brand-primary-light)" }}
          />
        </div>
      </div>
      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--brand-primary-light)" }}>
        <label className="flex items-center justify-between gap-3 text-sm font-medium">
          <span>Send automatically from Lodday promotions</span>
          <input
            type="checkbox"
            checked={autoSend}
            onChange={(event) => setAutoSend(event.target.checked)}
          />
        </label>
        {autoSend ? (
          <select
            value={cadence}
            onChange={(event) => setCadence(event.target.value)}
            className="mt-3 w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--brand-primary-light)" }}
          >
            <option>1 month</option>
            <option>2 months</option>
            <option>3 months</option>
          </select>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Custom Referral Email</label>
        <textarea
          rows={8}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
          style={{ borderColor: "var(--brand-primary-light)" }}
        />
      </div>
      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--brand-primary-light)", background: "var(--brand-bg-soft)" }}>
        <p className="text-sm" style={{ color: "var(--brand-primary-dark)" }}>
          Referral benefit: {discountType === "fixed" ? formatKes(discountValue) : `${discountValue}%`} off for both the client and the referred friend.
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--brand-accent-dark)" }}>
          Include an unsubscribe link in Lodday promotions emails and exclude opted-out clients from future campaigns at the backend layer.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
        >
          Close
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-3 text-sm font-semibold text-white"
          style={{ background: "var(--brand-primary)" }}
        >
          Save Referral Draft
        </button>
      </div>
    </div>
  );
}

function ModalShell({
  title,
  children,
  onClose,
  widthClassName = "max-w-xl",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  widthClassName?: string;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 p-3 sm:p-4">
      <div
        className={`flex max-h-[92vh] w-full flex-col rounded-[1.75rem] border p-4 shadow-2xl sm:p-5 ${widthClassName}`}
        style={{
          borderColor: "var(--brand-primary-light)",
          background: "linear-gradient(180deg, #ffffff 0%, var(--brand-bg-soft) 100%)",
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--brand-accent-dark)" }}>
              Action
            </p>
            <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-sm font-semibold"
            style={{ borderColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl border p-3"
      style={{ borderColor: "var(--brand-primary-light)", background: "var(--brand-bg-soft)" }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--brand-accent-dark)" }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-medium" style={{ color: "var(--brand-primary-dark)" }}>
        {value}
      </p>
    </div>
  );
}
