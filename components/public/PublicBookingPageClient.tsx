"use client";

import { useState } from "react";
import PublicBusinessHeader from "@/components/public/PublicBusinessHeader";
import ServicesGrid from "@/components/public/ServicesGrid";
import StickyBookingCTA from "@/components/public/StickyBookingCTA";

export interface ReferenceImage {
  _id: string;
  url: string;
}

export interface AddOn {
  title: string;
  price: number;
  durationMinutes: number;
}

export interface Promotion {
  _id: string;
  type: "percent" | "fixed" | "first_time" | "off_peak";
  value?: number;
  title?: string;
}

export interface BundleItem {
  serviceId: string;
  order?: number;
}

export interface Service {
  _id: string;
  name: string;
  price?: number;
  priceRange?: { min: number; max: number };
  currency?: string;
  durationMinutes: number;
  gallery?: string[];
  mobileEligible?: boolean;
  isBundle?: boolean;
  bundleItems?: BundleItem[];
  category?: string;
  featured?: boolean;
  promotions?: Promotion[];
  addOns?: AddOn[];
}

export interface SelectedService extends Service {
  selectedReferenceImages: string[];
  isMobile: boolean;
  addOns?: AddOn[];
  promotions?: { _id: string; title: string; type: "percent" | "fixed"; value: number }[];
}

export interface Business {
  _id: string;
  username: string;
  name: string;
  logo?: string;
  description?: string;
  bookingRules?: { autoApprove?: boolean };
  workingHours?: any;
  depositPolicy?: { enabled?: boolean };
}

export interface Theme {
  primary: string;
  accent: string;
  primaryLight?: string;
  accentLight?: string;
  primaryDark?: string;
  brandBgSoft?: string;
}

interface Props {
  business: Business;
  status: string;
  services: Service[];
  referenceImages: ReferenceImage[];
  theme: Theme;
}

export default function PublicBookingPageClient({
  business,
  status,
  services,
  theme,
}: Props) {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  const handleAddToSummary = (
    service: Service,
    selectedRefs: string[],
    isMobile: boolean,
    addOns?: AddOn[]
  ) => {
    // Map promotions to only include ones compatible with StickyBookingCTA
    const mappedPromotions = service.promotions
      ?.filter(p => p.type === "fixed" || p.type === "percent")
      .map(p => ({
        _id: p._id,
        title: p.title ?? "Promotion",
        type: p.type as "fixed" | "percent",
        value: p.value ?? 0,
      }));

    setSelectedServices(prev => [
      ...prev,
      {
        ...service,
        selectedReferenceImages: selectedRefs,
        isMobile,
        addOns,
        promotions: mappedPromotions,
      },
    ]);
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s._id !== serviceId));
  };

  return (
    <div
      className="min-h-screen p-4"
      style={{
        background: `linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.accentLight} 100%)`,
        color: theme.primaryDark,
      }}
    >
      <PublicBusinessHeader
        name={business.name}
        logo={business.logo}
        autoApprove={business.bookingRules?.autoApprove}
        description={business.description}
        openingHours={business.workingHours}
        theme={theme}
      />

      <ServicesGrid
        services={services}
        username={business.username}
        theme={theme}
        requiresDeposit={business.depositPolicy?.enabled || false}
        onAddToSummary={handleAddToSummary}
      />

      <StickyBookingCTA
        selectedServices={selectedServices}
        status={status}
        theme={theme}
        username={business.username}
        onRemoveService={handleRemoveService}
      />
    </div>
  );
}
