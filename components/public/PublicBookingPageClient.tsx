"use client";

import { useMemo, useState } from "react";
import PublicBusinessHeader from "@/components/public/PublicBusinessHeader";
import ServicesGrid from "@/components/public/ServicesGrid";
import StickyBookingCTA from "@/components/public/StickyBookingCTA";
import PortfolioShowcase from "@/components/public/PortfolioShowcase";
import CategoryServicesBrowser from "@/components/public/CategoryServicesBrowser";
import ReviewsSection from "@/components/home/ReviewsSection";

export interface ReferenceImage {
  _id: string;
  images?: Array<{
    _id?: string;
    url?: string;
    description?: string;
    totalCost?: number;
    durationMinutes?: number;
    priceBreakdown?: string;
    likes?: number;
  }>;
  linkedServiceIds?: string[];
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
  businessId?: string;
  name: string;
  username?: string;
  category?: string;
  currency?: string;
  isBundle?: boolean;
  description?: string;
  tags?: string[];

  basePrice?: number;

  priceRange?: {
    min?: number;
    max?: number;
  };

  priceTiers?: {
    label: string;
    price?: number;
  }[];

  sessionPackages?: {
    sessions: number;
    price: number;
  }[];

  areaPricing?: {
    area: string;
    price?: number;
  }[];

  durationMinutes: number;

  gallery?: string[];
  mobileEligible?: boolean;
  featured?: boolean;
  addOns?: AddOn[];
  businessDepositPolicy?: {
    enabled?: boolean;
    type?: "fixed" | "percent";
    value?: number;
    applyToCallout?: boolean;
  };
  priceBreakdown?: string;
  portfolioBooking?: {
    refId: string;
    imageId?: string;
    imageIndex: number;
    exactStyle: boolean;
  };
}

export interface SelectedService extends Service {
  selectedReferenceImages: string[];
  selectedRefs?: string[];
  isMobile: boolean;
  selectedAddOns?: AddOn[];
  selectedSessions?: { sessions: number; price: number; durationMinutes?: number }[];
  selectedAreas?: { area: string; min?: number; max?: number; price?: number }[];
  selectedTier?: { label: string; min?: number; max?: number; price?: number } | null;
  price?: number;
  depositAmount?: number;
   businessDepositPolicy?: {
    enabled?: boolean;
    type?: "fixed" | "percent";
    value?: number;
    applyToCallout?: boolean;
  };
}


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

export interface Business {
  _id: string;
  username: string;
  name: string;
  logo?: string;
  description?: string;

  bookingRules?: { autoApprove?: boolean };

  openingHours?: Record<
    string,
    { open: string; close: string; closed?: boolean }
  >;

  locationLabel?: string | null;
  locationLink?: string | null;

  depositRequired?: boolean;
  depositPolicy?: {
    enabled?: boolean;
    type?: "fixed" | "percent";
    value?: number;
    applyToCallout?: boolean;
  };
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
  seo: {
    businessName: string;
    location: string;
    serviceNames: string[];
    summarySentence: string;
    searchDescription: string;
    searchIntentPhrases: string[];
  };
}

function hexToRgb(hex: string) {
  const clean = (hex || "").replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const bigint = parseInt(normalized || "000000", 16);
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
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getReadableText(bg: string) {
  return luminance(bg) > 0.55 ? "#000000" : "#ffffff";
}

function isLight(hex: string) {
  return luminance(hex) > 0.6;
}

function cardFor(bg: string) {
  return isLight(bg) ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.34)";
}

function borderFor(bg: string) {
  return isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)";
}

function shadowFor(bg: string) {
  return isLight(bg)
    ? "0 20px 50px rgba(0,0,0,0.10)"
    : "0 20px 60px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.05)";
}

export default function PublicBookingPageClient({
  business,
  status,
  services,
  referenceImages,
  theme,
  seo,
}: Props) {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const bookingsInactive = String(status || "").toLowerCase() === "inactive";
  const base = theme?.primaryLight || "#ffffff";
  const pageBg = useMemo(
    () => `linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.accentLight} 100%)`,
    [theme.accentLight, theme.primaryLight]
  );
  const cardBg = cardFor(base);
  const cardBorder = borderFor(base);
  const cardShadow = shadowFor(base);
  const cardText = getReadableText(base);
  const servicePreview = seo.serviceNames.slice(0, 6);
  const servicePreviewText =
    servicePreview.length === 0
      ? ""
      : servicePreview.length === 1
        ? servicePreview[0]
        : `${servicePreview.slice(0, -1).join(", ")} and ${servicePreview[servicePreview.length - 1]}`;

  const handleAddToSummary = (data: AddToSummaryPayload) => {
    setSelectedServices(prev => [
      ...prev,
      {
        ...data.service,
        selectedReferenceImages: data.selectedRefs,
        selectedRefs: data.selectedRefs,
        isMobile: data.isMobile,
        selectedAddOns: data.selectedAddOns,
        selectedSessions: data.selectedSessions,
        selectedAreas: data.selectedAreas,
        selectedTier: data.selectedTier,
        price: data.price,
        durationMinutes: data.durationMinutes ?? data.service.durationMinutes,
        depositAmount: data.depositAmount,
      },
    ]);
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s._id !== serviceId));
  };
  const servicesWithDepositPolicy = useMemo(() => {
  return services.map(service => ({
    ...service,
    businessDepositPolicy: business.depositPolicy,
  }));
}, [services, business.depositPolicy]);

  return (
    <div
      className="relative min-h-screen p-4 md:p-6"
      style={{
        background: pageBg,
        color: cardText,
      }}
    >
      <div className={bookingsInactive ? "space-y-5 blur-[8px] pointer-events-none select-none" : "space-y-5"}>
      <div
        className="rounded-2xl p-3 md:p-4"
        style={{
          background: cardBg,
          color: cardText,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          backdropFilter: "blur(14px)",
        }}
      >
        <PublicBusinessHeader
          name={business.name}
          logo={business.logo}
          autoApprove={business.bookingRules?.autoApprove}
          description={business.description}
          openingHours={business.openingHours}
          locationLink={business.locationLink}
          locationLabel={business.locationLabel}
          depositRequired={business.depositRequired}
          theme={theme}
        />
      </div>

      <section
        className="rounded-2xl p-4 md:p-5"
        style={{
          background: cardBg,
          color: cardText,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          backdropFilter: "blur(14px)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">
          Book online
        </p>
        <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
          {seo.location
            ? `${seo.businessName} - ${seo.location}`
            : `${seo.businessName} appointments`}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 md:text-base md:leading-7">
          {seo.summarySentence}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 md:text-base md:leading-7">
          {business.description?.trim()
            ? business.description
            : "Browse services, compare availability, and confirm your appointment in a few steps."}
        </p>
        {servicePreviewText ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 md:text-base md:leading-7">
            Popular bookings include {servicePreviewText}. Choose a time slot and secure your
            appointment instantly.
          </p>
        ) : null}
      </section>

      <StickyBookingCTA
        selectedServices={selectedServices}
        status={status}
        theme={theme}
        username={business.username}
        onRemoveService={handleRemoveService}
      />

      <div
        className="rounded-2xl p-4 md:p-5"
        style={{
          background: cardBg,
          color: cardText,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          backdropFilter: "blur(14px)",
        }}
      >
        <PortfolioShowcase
          referenceImages={referenceImages}
          services={servicesWithDepositPolicy}
          theme={theme}
          username={business.username}
          onAddToSummary={handleAddToSummary}
        />
      </div>

      <section
        className="rounded-2xl p-4 md:p-5"
        style={{
          background: cardBg,
          color: cardText,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          backdropFilter: "blur(14px)",
        }}
      >
        <CategoryServicesBrowser
          services={servicesWithDepositPolicy}
          theme={theme}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </section>

      <section
        id="services"
        className="rounded-2xl p-4 md:p-5"
        style={{
          background: cardBg,
          color: cardText,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          backdropFilter: "blur(14px)",
        }}
      >
        <h2 className="text-xl font-semibold mb-4">Services and online booking</h2>
        <ServicesGrid
  services={servicesWithDepositPolicy}
  username={business.username}
  theme={theme}
  selectedCategory={selectedCategory}
 requiresDeposit={business.depositPolicy?.enabled || false}
  onAddToSummary={handleAddToSummary}
/>
      </section>

      <ReviewsSection
        scope="business"
        businessId={business._id}
        title={`Client Reviews for ${business.name}`}
        formReviewType="business"
        formBusinessId={business._id}
        formBusinessName={business.name}
        formBusinessUsername={business.username}
        formBusinessLogo={business.logo || ""}
      />

      <section
        className="rounded-2xl p-4 md:p-5"
        style={{
          background: cardBg,
          color: cardText,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          backdropFilter: "blur(14px)",
        }}
      >
        <h2 className="mb-2 text-lg font-semibold">Find and book the right service</h2>
        <p className="text-sm leading-6">{seo.searchDescription}</p>
        {seo.searchIntentPhrases.length > 0 ? (
          <p className="text-sm leading-6 mt-2">
            Popular searches: {seo.searchIntentPhrases.join(", ")}.
          </p>
        ) : null}
      </section>

      </div>

      {bookingsInactive ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          <div
            className="max-w-xl rounded-[28px] p-6 text-center md:p-8"
            style={{
              background: "rgba(255,255,255,0.82)",
              color: "#0f172a",
              border: `1px solid ${cardBorder}`,
              boxShadow: cardShadow,
              backdropFilter: "blur(18px)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Bookings unavailable
            </p>
            <h2 className="mt-3 text-2xl font-semibold md:text-3xl">
              {business.name} is not accepting bookings right now
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              This booking page is temporarily unavailable while the business is inactive. Please
              check back later or contact the business directly for updates.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
