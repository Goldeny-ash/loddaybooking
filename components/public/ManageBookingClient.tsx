"use client";

import { useEffect, useState } from "react";
import ReschedulePanel from "./ReschedulePanel";
import DepositModal from "./DepositModal";
import { getTheme } from "@/lib/theme";

/* ======================================================
   WCAG Contrast Utilities
====================================================== */

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  const bigint = parseInt(c.length === 3 ? c.split("").map(x => x + x).join("") : c, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
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
  return isLight(bg)
    ? "rgba(255,255,255,0.55)"   // frosted glass on light themes
    : "rgba(0,0,0,0.45)";        // smoked glass on dark themes
}

function cardFor(bg: string) {
  return isLight(bg)
    ? "rgba(255,255,255,0.75)"
    : "rgba(0,0,0,0.35)";
}

function borderFor(bg: string) {
  return isLight(bg)
    ? "rgba(0,0,0,0.08)"
    : "rgba(255,255,255,0.18)";
}

function shadowFor(bg: string) {
  return isLight(bg)
    ? "0 20px 50px rgba(0,0,0,0.10)"
    : "0 20px 60px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.05)";
}

/* ======================================================
   Component
====================================================== */

interface ManageBookingClientProps {
  bookingId: string;
  token: string;
}

export default function ManageBookingClient({ bookingId, token }: ManageBookingClientProps) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [theme, setTheme] = useState<any>(null);

  useEffect(() => {
    if (!bookingId || !token) {
      setError("Invalid link");
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/manage?bookingId=${bookingId}&token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setBooking(data);

        if (data.business) {
          const theme = getTheme(data.business);
          setTheme(theme);
        }

        if (data.status === "pendingDeposit" && data.depositAmount > 0) {
          setShowDeposit(true);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  if (loading) return <p className="p-10 text-center">Loading…</p>;
  if (error) return <p className="p-10 text-red-600">{error}</p>;

  const cancelBooking = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/bookings/cancel`, {
      method: "POST",
      body: JSON.stringify({ bookingId, token }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.ok) setBooking({ ...booking, status: "cancelled" });
    setActionLoading(false);
  };

  const rescheduleBooking = async () => {
    const newDate = prompt("Enter new date (YYYY-MM-DD)");
    const newStartTime = prompt("Enter new start time (HH:mm)");
    const newEndTime = prompt("Enter new end time (HH:mm)");
    if (!newDate || !newStartTime || !newEndTime) return;

    setActionLoading(true);
    const res = await fetch(`/api/bookings/reschedule`, {
      method: "POST",
      body: JSON.stringify({ bookingId, token, newDate, newStartTime, newEndTime }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.booking) setBooking(data.booking);
    setActionLoading(false);
  };

  const resendEmail = async () => {
    setActionLoading(true);
    await fetch(`/api/bookings/resend-email`, {
      method: "POST",
      body: JSON.stringify({ bookingId, token }),
      headers: { "Content-Type": "application/json" },
    });
    setActionLoading(false);
    alert("Confirmation email sent!");
  };

  const totalDeposit = booking.services?.reduce((sum: number, s: any) => sum + (s.depositAmount || 0), 0);

  /* ======================================================
     Auto-contrast colors
  ====================================================== */

  const gradientBg = theme
    ? `linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.accentLight} 100%)`
    : "#f3f4f6";

 const base = theme?.primaryLight || "#ffffff";

const glassBg = glassFor(base);
const glassText = getReadableText(base);

const cardBg = cardFor(base);
const cardText = getReadableText(base);

const glassBorder = borderFor(base);
const glassShadow = shadowFor(base);

  const primaryText = getReadableText(theme?.primary || "#000");
  const accentText = getReadableText(theme?.accent || "#000");
  const badgeText = getReadableText(theme?.accentLight || "#fff");

  return (
    <div className="min-h-screen p-6" style={{ background: gradientBg }}>
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
        <h1 className="text-3xl font-bold">Manage Booking</h1>

        {/* Status Card */}
        <div
          className="p-4 rounded-xl"
         style={{
  background: cardBg,
  color: cardText,
  border: `1px solid ${glassBorder}`,
}}

        >
          <p className="font-medium">
            Status:{" "}
            <span className="font-semibold">{booking.status}</span>

            {booking.status === "pendingDeposit" && booking.depositAmount > 0 && (
              <span
                className="ml-3 text-xs px-3 py-1 rounded-full font-semibold"
                style={{
                  background: theme?.accentLight,
                  color: badgeText,
                }}
              >
                Deposit Pending
              </span>
            )}
          </p>

          <p className="mt-2">Date: {booking.date}</p>
          <p>Time: {booking.startTime} – {booking.endTime}</p>
        </div>

        {/* Services */}
        {booking.services.map((s: any, i: number) => (
          <div
            key={i}
            className="p-4 rounded-xl shadow-md"
            style={{
              background: cardBg,
              color: cardText,
              border: `1px solid ${mix(theme?.primary || "#fff", 0.4)}`,
            }}
          >
            <p className="font-semibold">{s.serviceName}</p>
            {s.staffName && <p className="text-sm opacity-80">Staff: {s.staffName}</p>}
            <p>Price: KES {s.price}</p>
            {s.depositAmount > 0 && (
              <p className="text-sm">
                Deposit:{" "}
                <span className="font-semibold">KES {s.depositAmount}</span>
              </p>
            )}
          </div>
        ))}

        {/* Pay Deposit */}
        {booking.status === "pendingDeposit" && booking.depositAmount > 0 && !showDeposit && (
          <button
            onClick={() => setShowDeposit(true)}
            className="w-full py-3 rounded-xl font-semibold transition hover:scale-[1.02]"
            style={{ background: theme?.primary, color: primaryText }}
          >
            Pay Deposit: KES {booking.depositAmount}
          </button>
        )}

        {showDeposit && (
          <DepositModal
            bookingId={booking._id}
            amount={booking.depositAmount}
            serviceName={booking.services.map((s: any) => s.serviceName).join(", ")}
            calloutFee={booking.calloutFee}
            onSuccess={() => {
              setBooking({ ...booking, status: "confirmed" });
              setShowDeposit(false);
            }}
            onClose={() => setShowDeposit(false)}
          />
        )}

        {/* Cancel */}
        <button
          disabled={actionLoading || booking.status === "cancelled"}
          onClick={cancelBooking}
          className="w-full py-3 rounded-xl font-semibold transition"
          style={{ background: theme?.accent, color: accentText }}
        >
          Cancel Booking
        </button>

        {/* Reschedule */}
        <button
          disabled={booking.status === "cancelled"}
          onClick={() => setShowReschedule(true)}
          className="w-full py-3 rounded-xl font-semibold transition"
          style={{ background: theme?.accent, color: accentText }}
        >
          Reschedule Booking
        </button>

        {showReschedule && (
          <ReschedulePanel
            booking={booking}
            token={token}
            onUpdated={(b) => {
              setBooking(b);
              setShowReschedule(false);
            }}
          />
        )}

        {/* Resend */}
        <button
          disabled={actionLoading}
          onClick={resendEmail}
          className="w-full py-3 rounded-xl font-semibold transition"
          style={{ background: theme?.accent, color: accentText }}
        >
          Resend Confirmation Email
        </button>
      </div>
    </div>
  );
}
