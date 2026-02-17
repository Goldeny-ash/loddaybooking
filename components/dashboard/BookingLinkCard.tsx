"use client";
import { useState } from "react";

interface BookingLinkCardProps {
  username: string;
  className?: string;
}

export default function BookingLinkCard({ username, className = "" }: BookingLinkCardProps) {
  const bookingUrl = `https://booking.lodday.com/b/${username}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow p-4 space-y-3 ${className}`}
      style={{ backgroundColor: "var(--brand-bg-soft)" }}
    >
      <h3 className="font-semibold text-[var(--brand-primary)]">Booking Link</h3>

      <div className="flex items-center justify-between gap-2 bg-gray-50 rounded p-2">
        <span className="text-sm truncate">{bookingUrl}</span>
        <button
          onClick={copy}
          className="text-sm px-3 py-1 rounded bg-[var(--brand-primary)] text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
