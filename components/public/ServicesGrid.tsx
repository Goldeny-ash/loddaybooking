"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import ServiceCard from "./ServiceCard";
import type { Service, AddOn, Theme } from "@/components/public/PublicBookingPageClient";

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

interface ServicesGridProps {
  services: Service[];
  username: string;
  requiresDeposit: boolean;
  theme: Theme;
  selectedCategory?: string;
  onAddToSummary: (data: AddToSummaryPayload) => void;
}

type ScrollMode = "vertical" | "horizontal";

export default function ServicesGrid({
  services,
  username,
  requiresDeposit,
  theme,
  selectedCategory = "All",
  onAddToSummary,
}: ServicesGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollMode, setScrollMode] = useState<ScrollMode>("vertical");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollSnapshot = useRef({ left: 0, top: 0 });

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !searchTerm ||
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === "All" ? true : service.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, selectedCategory]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        left: scrollSnapshot.current.left,
        top: scrollSnapshot.current.top,
        behavior: "auto",
      });
    });
  }, [scrollMode, filteredServices.length]);

  const handleToggleScrollMode = () => {
    const container = containerRef.current;
    if (container) {
      scrollSnapshot.current = {
        left: container.scrollLeft,
        top: container.scrollTop,
      };
    }

    setScrollMode((current) => (current === "vertical" ? "horizontal" : "vertical"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-96 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
        />

        <button
          type="button"
          onClick={handleToggleScrollMode}
          className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:scale-[1.01]"
          style={{
            borderColor: `${theme.primary}44`,
            color: theme.primaryDark || theme.primary,
            background: theme.brandBgSoft || "rgba(255,255,255,0.55)",
          }}
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>{scrollMode === "horizontal" ? "Vertical Scroll" : "Horizontal Scroll"}</span>
        </button>
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground, #9ca3af)]">
          No services match your search.
        </div>
      ) : (
        <div
          ref={containerRef}
          className={
            scrollMode === "horizontal"
              ? "flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory"
              : "grid gap-6 sm:grid-cols-2"
          }
        >
          {filteredServices.map(service => (
            <div
              key={service._id}
              className={scrollMode === "horizontal" ? "w-[280px] shrink-0 snap-start md:w-[320px]" : ""}
            >
              <ServiceCard
                service={service}
                username={username}
                requiresDeposit={requiresDeposit}
                theme={theme}
                onAddToSummary={onAddToSummary}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
