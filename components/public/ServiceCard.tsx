"use client";

import { useState } from "react";
import Image from "next/image";
import ServiceModal from "./ServiceModal";
import type { Service, AddOn } from "@/components/public/PublicBookingPageClient";

interface ServiceCardProps {
  service: Service;
  username: string;
  requiresDeposit: boolean;
  theme: any;
  onAddToSummary: (service: Service, selectedRefs: string[], isMobile: boolean, addOns?: AddOn[]) => void;
}

export default function ServiceCard({ service, username, requiresDeposit, theme, onAddToSummary }: ServiceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const heroImage = service.gallery?.[0] || "/images/placeholder.png";

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
          <p className="text-sm text-black/80">⏱ {service.durationMinutes} min</p>
          <p className="text-sm text-black/90">
            {service.priceRange
              ? `${service.currency || "KES"} ${service.priceRange.min} - ${service.priceRange.max}`
              : service.price
              ? `${service.currency || "KES"} ${service.price}`
              : "Price on request"}
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

          {requiresDeposit && <p className="text-xs text-black/70">⚠ Deposit required to book</p>}
        </div>
      </div>

      {isModalOpen && (
        <ServiceModal
          service={service}
          theme={theme}
          onClose={() => setIsModalOpen(false)}
          onAddToSummary={(data) => {
            onAddToSummary(data.service, data.selectedRefs, data.isMobile, data.selectedAddOns);
            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
}
