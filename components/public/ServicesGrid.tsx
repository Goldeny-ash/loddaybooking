"use client";

import { useState, useMemo } from "react";
import ServiceCard from "./ServiceCard";
import type { Service, AddOn } from "@/components/public/PublicBookingPageClient";

interface ServicesGridProps {
  services: Service[];
  username: string;
  requiresDeposit: boolean;
  theme: any;
  onAddToSummary: (service: Service, selectedRefs: string[], isMobile: boolean, addOns?: AddOn[]) => void;
}

export default function ServicesGrid({
  services,
  username,
  requiresDeposit,
  theme,
  onAddToSummary,
}: ServicesGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    return services.filter(
      s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [services, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-96 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground, #9ca3af)]">
          No services match your search.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {filteredServices.map(service => (
            <ServiceCard
              key={service._id}
              service={service}
              username={username}
              requiresDeposit={requiresDeposit}
              theme={theme}
              onAddToSummary={onAddToSummary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
