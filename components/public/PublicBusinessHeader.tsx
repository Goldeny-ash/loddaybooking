"use client";

import Image from "next/image";
import { useMemo } from "react";

interface Props {
  name: string;
  logo?: string[] | string | null;
  description?: string;
  autoApprove?: boolean;
  locationLink?: string | null;
  locationLabel?: string | null;
  openingHours?: Record<string, { open: string; close: string; closed?: boolean }>;
  depositRequired?: boolean;
  responseTime?: string;
  theme?: {
    primary: string;
    accent: string;
    brandBgSoft?: string;
  };
}

export default function PublicBusinessHeader({
  name,
  logo,
  description,
  autoApprove,
  locationLink,
  locationLabel,
  openingHours,
  depositRequired,
  responseTime,
  theme,
}: Props) {
  const logoUrl =
    typeof logo === "string"
      ? logo
      : Array.isArray(logo) && logo.length > 0
      ? logo[0]
      : null;

  const hoursToday = useMemo(() => {
    if (!openingHours) return null;

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayKey = days[new Date().getDay()];
    const matchedKey = Object.keys(openingHours).find(
      (key) => key.toLowerCase() === todayKey
    );
    const hours = matchedKey ? openingHours[matchedKey] : openingHours[todayKey];

    if (!hours) return null;
    return hours.closed ? "Closed today" : `${hours.open} - ${hours.close}`;
  }, [openingHours]);

  const locationText = locationLabel?.trim() || "Not provided";
  const depositText = depositRequired ? "Required" : "Not required";

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center text-center p-8 rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme?.primary} 0%, ${theme?.accent} 100%)`,
      }}
    >
      <div className="absolute inset-0 bg-white/20 backdrop-blur-md pointer-events-none rounded-xl" />

      <div className="relative flex flex-col items-center gap-4 max-w-3xl">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={name}
            width={96}
            height={96}
            className="rounded-xl object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-xl flex items-center justify-center font-bold text-2xl text-white border-2 border-white shadow-md"
            style={{ backgroundColor: theme?.brandBgSoft || "rgba(255,255,255,0.3)" }}
          >
            {name?.charAt(0)}
          </div>
        )}

        <h1 className="text-3xl font-bold text-white">{name}</h1>
        {description && <p className="text-white/90 text-base">{description}</p>}

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/90 mt-2">
          {locationLink ? (
            <a
              href={locationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              Location: {locationText}
            </a>
          ) : (
            <span>Location: {locationText}</span>
          )}

          <span>
            Hours today: <span className="font-medium">{hoursToday || "Not set"}</span>
          </span>

          {autoApprove !== undefined && (
            <span>{autoApprove ? "Instant confirmation" : "Approval required"}</span>
          )}
          <span>Deposit: {depositText}</span>
          {responseTime && <span>Response: {responseTime}</span>}
        </div>

        <a
          href="#services"
          className="mt-6 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:opacity-90 transition"
          style={{ backgroundColor: theme?.accent }}
        >
          Select a Service
        </a>
      </div>
    </div>
  );
}
