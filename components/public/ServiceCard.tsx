"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock3 } from "lucide-react";
import ServiceModal from "./ServiceModal";
import type { Service, AddOn, Theme } from "@/components/public/PublicBookingPageClient";
import { formatDuration } from "@/lib/utils/formatDuration";

interface AddToSummaryPayload {
  service: Service;
  selectedRefs: string[];
  isMobile: boolean;
  selectedAddOns?: AddOn[];
  selectedSessions?: { sessions: number; price: number; durationMinutes?: number }[];
  selectedAreas?: { area: string; min?: number; max?: number; price?: number }[];
  selectedTier?: { label: string; min?: number; max?: number; price?: number } | null;
  price?: number;
  durationMinutes?: number;
  depositAmount?: number;
}

interface ServiceCardProps {
  service: Service;
  username: string;
  requiresDeposit: boolean;
  theme: Theme;
  onAddToSummary: (data: AddToSummaryPayload) => void;
}

function getPreviewPrice(service: Service) {
  const currency = "KES";

  if (service.basePrice) {
    return `${currency} ${service.basePrice.toLocaleString()}`;
  }

  if (service.priceRange?.min) {
    return `From ${currency} ${service.priceRange.min.toLocaleString()}`;
  }

  if (service.priceTiers?.length) {
    const validTiers = service.priceTiers.filter(
      (tier): tier is { label: string; price: number } =>
        typeof tier.price === "number" && tier.price > 0
    );
    if (!validTiers.length) return "Click to view pricing";
    const min = Math.min(...validTiers.map((tier) => tier.price));
    return `Starts from ${currency} ${min.toLocaleString()}`;
  }

  if (service.sessionPackages?.length) {
    const min = Math.min(...service.sessionPackages.map((pkg) => pkg.price || 0));
    return `Packages from ${currency} ${min.toLocaleString()}`;
  }

  return "Click to view pricing";
}

export default function ServiceCard({
  service,
  username,
  requiresDeposit,
  theme,
  onAddToSummary,
}: ServiceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const heroImage = service.gallery?.[0];
  const hasImage = Boolean(heroImage);
  const serviceRequiresDeposit = service.businessDepositPolicy?.enabled || requiresDeposit;
  const durationLabel = formatDuration(service.durationMinutes);

  return (
    <>
      <div
        className={`cursor-pointer rounded-xl border shadow-md transition hover:shadow-xl ${
          hasImage ? "overflow-hidden" : "p-6"
        }`}
        style={{
          background: theme?.brandBgSoft || "rgba(255,255,255,0.15)",
          border: `1px solid ${theme?.primary}`,
          backdropFilter: "blur(12px)",
        }}
        onClick={() => setIsModalOpen(true)}
      >
        {hasImage ? (
          <>
            <div className="relative h-40 w-full">
              <Image src={heroImage || ""} alt={service.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <div className="space-y-2 p-4">
              <h3 className="text-lg font-semibold" style={{ color: theme.primary }}>
                {service.name}
              </h3>
              {durationLabel ? (
                <p className="flex items-center gap-2 text-sm text-black/80">
                  <Clock3 className="h-4 w-4" />
                  <span>{durationLabel}</span>
                </p>
              ) : null}
              <p className="text-sm font-semibold" style={{ color: theme.primaryDark }}>
                {getPreviewPrice(service)}
              </p>

              {service.featured ? (
                <span className="inline-block rounded-full bg-yellow-300 px-2 py-1 text-xs font-semibold">
                  Featured
                </span>
              ) : null}

              {service.mobileEligible ? (
                <span className="inline-block rounded-full bg-white/20 px-2 py-1 text-xs text-black/90">
                  Mobile Eligible
                </span>
              ) : null}

              {serviceRequiresDeposit ? (
                <p className="text-xs text-black/70">Deposit required to book</p>
              ) : null}

              {service.addOns?.length ? (
                <span className="inline-block rounded-full bg-white/20 px-2 py-1 text-xs text-black/90">
                  Add-ons available
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <h3 className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
              {service.name}
            </h3>
            {durationLabel ? (
              <p className="flex items-center gap-2 text-sm text-black/80">
                <Clock3 className="h-4 w-4" />
                <span>{durationLabel}</span>
              </p>
            ) : null}
            <p className="text-sm font-semibold" style={{ color: theme.primaryDark }}>
              {getPreviewPrice(service)}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-black/70">
              {service.mobileEligible ? (
                <span className="rounded-full bg-white/20 px-3 py-1">Mobile Eligible</span>
              ) : null}
              {serviceRequiresDeposit ? (
                <span className="rounded-full bg-white/20 px-3 py-1">Deposit required</span>
              ) : null}
              {service.addOns?.length ? (
                <span className="rounded-full bg-white/20 px-3 py-1">Add-ons available</span>
              ) : null}
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.25em]" style={{ color: theme.primaryDark }}>
              Click to view
            </p>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <ServiceModal
          service={service}
          theme={theme}
          onClose={() => setIsModalOpen(false)}
          onAddToSummary={(data) => {
            onAddToSummary(data);
            setIsModalOpen(false);
          }}
          username={username}
        />
      ) : null}
    </>
  );
}
