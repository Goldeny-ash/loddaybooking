"use client";

import { useState } from "react";
import Image from "next/image";
import ServiceModal from "./ServiceModal";
import type { Service, AddOn, Theme } from "@/components/public/PublicBookingPageClient";

interface AddToSummaryPayload {
  service: Service;
  selectedRefs: string[];
  isMobile: boolean;
  selectedAddOns?: AddOn[];
  selectedSessions?: { sessions: number; price: number; durationMinutes?: number }[];
  selectedAreas?: { area: string; min?: number; max?: number; price?: number }[];
  selectedTier?: { label: string; min?: number; max?: number; price?: number } | null;
  promotions?: { _id: string; title: string; type: "percent" | "fixed" | string; value: number }[];
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

export default function ServiceCard({ service, username, requiresDeposit, theme, onAddToSummary }: ServiceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const heroImage = service.gallery?.[0] || "/images/placeholder.png";
  const formatDuration = (service: Service) => {
  const mins = service.durationMinutes || 0;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;

  if (hours && remainder) return `${hours}h ${remainder}min`;
  if (hours) return `${hours}h`;
  return `${remainder} min`;
};

const getPreviewPrice = (service: Service) => {
  const currency = "KES";

  if (service.basePrice) {
    return `${currency} ${service.basePrice.toLocaleString()}`;
  }

  if (service.priceRange?.min) {
    return `From ${currency} ${service.priceRange.min.toLocaleString()}`;
  }

  if (service.priceTiers?.length) {
    const validTiers = service.priceTiers.filter(
      (t): t is { label: string; price: number } =>
        typeof t.price === "number" && t.price > 0
    );
    if (!validTiers.length) return "Click to view pricing";
    const min = Math.min(...validTiers.map(t => t.price));
    return `Starts from ${currency} ${min.toLocaleString()}`;
  }

  if (service.sessionPackages?.length) {
    const min = Math.min(...service.sessionPackages.map(p => p.price || 0));
    return `Packages from ${currency} ${min.toLocaleString()}`;
  }

  return "Click to view pricing";
};

const serviceRequiresDeposit =
  service.businessDepositPolicy?.enabled ||
  requiresDeposit;

  return (
    <>
      <div
        className="relative flex flex-col rounded-xl overflow-hidden shadow-md cursor-pointer transition transform hover:scale-[1.02] hover:shadow-xl"
        style={{
          background: theme?.brandBgSoft || "rgba(255,255,255,0.15)",
          border: `1px solid ${theme?.primary}`,
          backdropFilter: "blur(12px)",
        }}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full h-40">
          <Image src={heroImage} alt={service.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="p-4 space-y-2 flex flex-col">
          <h3 className="text-lg font-semibold" style={{ color: theme?.primary }}>
            {service.name}
          </h3>
          {/* Duration */}
<p className="text-sm text-black/80">
  ⏱ {formatDuration(service)}
</p>

{/* Pricing */}
<p
  className="text-sm font-semibold"
  style={{ color: theme.primaryDark }}
>
  {getPreviewPrice(service)}
</p>

          <div className="flex flex-wrap gap-2 mt-2">
            {service.featured && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-300 font-semibold">
                ⭐ Featured
              </span>
            )}
            {service.promotions?.map((promo, idx) => {
              let bg, text;
              switch (promo.type) {
                case "percent": bg = "bg-red-200"; text = "text-red-800"; break;
                case "fixed": bg = "bg-green-200"; text = "text-green-800"; break;
                case "first_time": bg = "bg-blue-200"; text = "text-blue-800"; break;
                default: bg = "bg-yellow-200"; text = "text-yellow-800";
              }
              return (
                <span key={idx} className={`text-xs px-2 py-1 rounded-full font-semibold ${bg} ${text}`}>
                  {promo.type === "percent"
                    ? `🔥 ${promo.value}% Off`
                    : promo.type === "fixed"
                    ? `🔥 KES ${promo.value} Off`
                    : promo.type === "first_time"
                    ? "⭐ First-time"
                    : "⏰ Off-Peak"}
                </span>
              );
            })}
          </div>

          {service.mobileEligible && (
            <span className="text-xs px-2 py-1 bg-white/20 rounded-full text-black/90 w-fit inline-block mt-1">
              📱 Mobile Eligible
            </span>
          )}

          {serviceRequiresDeposit && <p className="text-xs text-black/70">⚠ Deposit required to book</p>}
          {service.addOns?.length ? (
  <span className="text-xs px-2 py-1 bg-white/20 rounded-full text-black/90 w-fit inline-block mt-1">
    ➕ Add-ons available
  </span>
) : null}
        </div>
      </div>

      {isModalOpen && (
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
      )}
    </>
  );
}
