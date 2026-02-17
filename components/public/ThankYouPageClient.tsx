"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { getTheme, applyThemeToRoot } from "@/lib/theme";
import DepositModal from "./DepositModal";
import ReschedulePanel from "./ReschedulePanel";

/* ======================================================
   WCAG Contrast Utilities
====================================================== */

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  const bigint = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getReadableText(bg: string) {
  return luminance(bg) > 0.55 ? "#000000" : "#ffffff";
}

function mix(hex: string, opacity: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function isLight(hex: string) {
  return luminance(hex) > 0.6;
}

function glassFor(bg: string) {
  return isLight(bg) ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
}

function cardFor(bg: string) {
  return isLight(bg) ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.35)";
}

function borderFor(bg: string) {
  return isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)";
}

function shadowFor(bg: string) {
  return isLight(bg)
    ? "0 20px 50px rgba(0,0,0,0.10)"
    : "0 20px 60px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.05)";
}

/* ======================================================
   Component
====================================================== */

export default function ThankYouPageClient() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const token = searchParams.get("token");

  const [booking, setBooking] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch booking from the same endpoint as ManageBookingClient
  useEffect(() => {
    if (!bookingId || !token) {
      setError("Invalid booking link");
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/manage?bookingId=${bookingId}&token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBooking(data);

        if (data.business) {
          const t = getTheme(data.business);
          setTheme(t);
          applyThemeToRoot(t);
        }

        if (data.status === "pendingDeposit" && data.depositAmount > 0) {
          setShowDeposit(true);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  if (loading) return <p className="p-10 text-center">Loading…</p>;
  if (error || !booking) return <p className="p-10 text-red-600">{error}</p>;
  if (!theme) return null;

  const base = theme.primaryLight;
  const glassBg = glassFor(base);
  const cardBg = cardFor(base);
  const glassText = getReadableText(base);
  const cardText = getReadableText(base);
  const glassBorder = borderFor(base);
  const glassShadow = shadowFor(base);
  const primaryText = getReadableText(theme.primary);
  const accentText = getReadableText(theme.accent);
  const badgeText = getReadableText(theme.accentLight);

  const manageUrl = `/b/${booking.business.username}/manage?bookingId=${booking._id}&token=${token}`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const calendarUrl = booking.date && booking.startTime && booking.endTime
    ? `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        booking.services.map((s: any) => s.serviceName).join(", ")
      )}&dates=${new Date(`${booking.date}T${booking.startTime}:00`).toISOString().replace(/-|:|\.\d+/g, "")}/${new Date(`${booking.date}T${booking.endTime}:00`).toISOString().replace(/-|:|\.\d+/g, "")}&details=${encodeURIComponent(`Booking with ${booking.business.name}`)}`
    : "";

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: `linear-gradient(135deg, ${theme.primaryLight}, ${theme.accentLight})` }}
    >
      <div
        className="max-w-3xl mx-auto rounded-2xl p-8 space-y-6 shadow-xl"
        style={{
          background: glassBg,
          color: glassText,
          backdropFilter: "blur(18px)",
          border: `1px solid ${glassBorder}`,
          boxShadow: glassShadow,
        }}
      >
        <div className="text-center space-y-6">
          <CheckCircle className="mx-auto h-16 w-16" style={{ color: theme.accent }} />
          <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
          {booking.business.logo && <img src={booking.business.logo} alt={booking.business.name} className="h-14 mx-auto" />}
          <p className="opacity-80">
            Thank you for booking with <strong>{booking.business.name}</strong>
          </p>

          {/* Booking Details */}
          <div
            className="rounded-xl p-5 space-y-3 text-left"
            style={{
              background: cardBg,
              color: cardText,
              border: `1px solid ${glassBorder}`,
            }}
          >
            {booking.services.map((s: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <p><b>{s.serviceName}</b></p>
                {s.staffName && <p>Staff: {s.staffName}</p>}
                <p>Price: KES {s.price}</p>
              </div>
            ))}
            <p>Date & Time: {booking.date} · {booking.startTime} – {booking.endTime}</p>
            <p>Status: {booking.status}</p>
            {booking.note && <p>Note: {booking.note}</p>}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <a href={manageUrl} className="block py-3 rounded-xl font-semibold" style={{ background: theme.accent, color: accentText }}>
              Manage / Reschedule
            </a>
            <a href={calendarUrl} target="_blank" className="block py-3 rounded-xl" style={{ background: cardBg, color: cardText }}>
              Add to Google Calendar
            </a>
            <button onClick={() => navigator.share?.({ title: "My Booking", url: shareUrl })} className="block w-full py-3 rounded-xl" style={{ background: cardBg, color: cardText }}>
              Share confirmation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
