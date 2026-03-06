"use client";

import { useEffect, useState, useMemo } from "react";
import ReschedulePanel from "./ReschedulePanel";
import DepositModal from "./DepositModal";
import { getTheme } from "@/lib/theme";
import type { BrandTheme } from "@/lib/theme";
import { toast } from "react-hot-toast";

/* ======================================================
   WCAG Contrast Utilities
====================================================== */

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;

  const bigint = parseInt(normalized, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const a = [r, g, b].map((v) => {
    const val = v / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
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
    ? "rgba(255,255,255,0.55)"
    : "rgba(0,0,0,0.45)";
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
   Types
====================================================== */

interface ManageBookingClientProps {
  bookingId: string;
  token: string;
}

interface ServiceItem {
  serviceName: string;
  price: number;
  depositAmount?: number;
  staffName?: string | null;
}

interface BookingData {
  _id: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName?: string;
  depositAmount?: number;
  calloutFee?: number;
  services: ServiceItem[];
  business?: Record<string, unknown>;
}

function normalizeStatus(status?: string) {
  return (status || "").replace(/[\s_-]/g, "").toLowerCase();
}

/* ======================================================
   Component
====================================================== */

export default function ManageBookingClient({
  bookingId,
  token,
}: ManageBookingClientProps) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [theme, setTheme] = useState<BrandTheme | null>(null);
  const [linkClosed, setLinkClosed] = useState(false);

  /* ======================================================
     Fetch Booking
  ====================================================== */

  useEffect(() => {
    if (!bookingId || !token) {
      setError("Invalid booking link.");
      setLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        const res = await fetch(
          `/api/bookings/manage?bookingId=${bookingId}&token=${token}`
        );

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 410) {
            setLinkClosed(true);
          }
          throw new Error(data.error || "Failed to load booking");
        }

        setBooking(data);

        if (data.business) {
          setTheme(getTheme(data.business));
        }

        const deposit = Number(data.depositAmount || 0);
        const normalized = normalizeStatus(data.status);

        if (normalized === "pendingdeposit" && deposit > 0) {
          setShowDeposit(true);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        if (message.toLowerCase().includes("no longer active")) {
          setLinkClosed(true);
          setError(null);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, token]);

  /* ======================================================
     Derived Values
  ====================================================== */

  const depositAmount = useMemo(() => {
    const bookingLevel = Number(booking?.depositAmount || 0);
    const serviceLevel = Array.isArray(booking?.services)
      ? booking.services.reduce(
          (sum, s) => sum + Number(s.depositAmount || 0),
          0
        )
      : 0;

    return Math.max(bookingLevel, serviceLevel);
  }, [booking]);

  const normalizedStatus = normalizeStatus(booking?.status);

  const canPayDeposit = normalizedStatus === "pendingdeposit" && depositAmount > 0;

  const canMarkComplete = normalizedStatus === "confirmed";
  const reviewUrl = booking
    ? `/review/${booking._id}?token=${token}&source=manage`
    : "";

  /* ======================================================
     Actions
  ====================================================== */

  const markCompleted = async () => {
    if (!booking) return;

    const confirmed = window.confirm(
      "Are you sure you want to mark this service as completed?"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);

      const res = await fetch(
        `/api/bookings/${booking._id}/complete`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setBooking((prev) =>
        prev ? { ...prev, status: "completed" } : prev
      );
      setLinkClosed(true);

      toast.success("Service marked as completed.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking) return;

    try {
      setActionLoading(true);

      const res = await fetch(`/api/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setBooking((prev) =>
        prev ? { ...prev, status: "cancelled" } : prev
      );

      toast.success("Booking cancelled.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const resendEmail = async () => {
    try {
      setActionLoading(true);

      await fetch(`/api/bookings/resend-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token }),
      });

      toast.success("Confirmation email sent.");
    } catch {
      toast.error("Failed to resend email.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ======================================================
     Theme Styling
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

  /* ======================================================
     Render Guards
  ====================================================== */

  if (loading)
    return <p className="p-10 text-center">Loading…</p>;

  if (error)
    return <p className="p-10 text-red-600">{error}</p>;

  if (linkClosed)
    return (
      <p className="p-10 text-center">
        This manage booking page is now closed because the booking was marked complete.
      </p>
    );

  if (!booking)
    return <p className="p-10 text-center">Booking not found</p>;

  /* ======================================================
     UI
  ====================================================== */

  return (
    <div className="min-h-screen p-6" style={{ background: gradientBg }}>
      <div
        className="max-w-3xl mx-auto rounded-2xl p-8 space-y-6"
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
            <span className="font-semibold capitalize">
              {booking.status}
            </span>

            {canPayDeposit && (
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
          <p>
            Time: {booking.startTime} – {booking.endTime}
          </p>
        </div>

        {/* Services */}
        {booking.services.map((s, i) => (
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
            {s.staffName && (
              <p className="text-sm opacity-80">
                Staff: {s.staffName}
              </p>
            )}
            <p>Price: KES {s.price}</p>
            {Number(s.depositAmount) > 0 && (
              <p className="text-sm">
                Deposit:{" "}
                <span className="font-semibold">
                  KES {Number(s.depositAmount)}
                </span>
              </p>
            )}
          </div>
        ))}

        {/* Deposit Button */}
        {canPayDeposit && !showDeposit && (
          <button
            onClick={() => setShowDeposit(true)}
            className="w-full py-3 rounded-xl font-semibold transition hover:scale-[1.02]"
            style={{
              background: theme?.primary,
              color: primaryText,
            }}
          >
            Pay Deposit: KES {depositAmount}
          </button>
        )}

        {/* Deposit Modal */}
        {showDeposit && (
          <DepositModal
            bookingId={booking._id}
            amount={depositAmount}
            serviceName={booking.services
              .map((s) => s.serviceName)
              .join(", ")}
            calloutFee={booking.calloutFee}
            onSuccess={() => {
              setBooking((prev) =>
                prev ? { ...prev, status: "confirmed" } : prev
              );
              setShowDeposit(false);
            }}
            onClose={() => setShowDeposit(false)}
          />
        )}

        {/* Mark Completed */}
        {canMarkComplete && (
          <button
            disabled={actionLoading || normalizedStatus !== "confirmed"}
            onClick={markCompleted}
            className="w-full py-3 rounded-xl font-semibold bg-green-600 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {actionLoading
              ? "Processing..."
              : normalizedStatus !== "confirmed"
              ? "Mark Service As Completed (available after deposit payment)"
              : "Mark Service As Completed"}
          </button>
        )}

        {/* Cancel */}
        <button
          disabled={actionLoading || normalizeStatus(booking.status) === "cancelled"}
          onClick={cancelBooking}
          className="w-full py-3 rounded-xl font-semibold transition"
          style={{
            background: theme?.accent,
            color: accentText,
          }}
        >
          Cancel Booking
        </button>

        {/* Reschedule */}
        <button
          disabled={normalizeStatus(booking.status) === "cancelled"}
          onClick={() => setShowReschedule(true)}
          className="w-full py-3 rounded-xl font-semibold transition"
          style={{
            background: theme?.accent,
            color: accentText,
          }}
        >
          Reschedule Booking
        </button>

        {showReschedule && (
          <ReschedulePanel
            booking={booking}
            token={token}
            onUpdated={(updated) => {
              setBooking(updated);
              setShowReschedule(false);
            }}
          />
        )}

        {/* Resend Email */}
        <button
          disabled={actionLoading}
          onClick={resendEmail}
          className="w-full py-3 rounded-xl font-semibold transition"
          style={{
            background: theme?.accent,
            color: accentText,
          }}
        >
          Resend Confirmation Email
        </button>

        {reviewUrl && (
          <a
            href={reviewUrl}
            className="block w-full rounded-xl py-3 text-center font-semibold transition hover:opacity-90"
            style={{
              background: theme?.primary,
              color: primaryText,
            }}
          >
            Leave a Review
          </a>
        )}
      </div>
    </div>
  );
}
