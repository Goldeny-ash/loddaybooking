"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Service, AddOn, Theme } from "@/components/public/PublicBookingPageClient";
import { createPortal } from "react-dom";
import { formatDuration } from "@/lib/utils/formatDuration";

interface PriceTier {
  label: string;
  min?: number;
  max?: number;
  price?: number;
}

interface SessionPackage {
  sessions: number;
  price: number;
  durationMinutes?: number;
}

interface AreaPricing {
  area: string;
  min?: number;
  max?: number;
  price?: number;
}

interface BundleItemWithPrice {
  price?: number;
}

interface DepositOverride {
  enabled: boolean;
  type: "percent" | "fixed";
  value: number;
}

type ModalService = Service & {
  username?: string;
  category?: string;
  currency?: string;
  isBundle?: boolean;
  description?: string;
  tags?: string[];
  basePrice?: number;
  priceTiers?: PriceTier[];
  sessionPackages?: SessionPackage[];
  areaPricing?: AreaPricing[];
  bundleItems?: BundleItemWithPrice[];
  depositOverride?: DepositOverride;
  businessDepositPolicy?: {
    enabled?: boolean;
    type?: "fixed" | "percent";
    value?: number;
    applyToCallout?: boolean;
  };
};

interface ServiceModalProps {
  service: ModalService;
  theme: Theme;
  username?: string;
  onClose: () => void;
  onAddToSummary: (data: {
    service: ModalService;
    selectedRefs: string[];
    isMobile: boolean;
    selectedAddOns?: AddOn[];
    selectedSessions?: SessionPackage[];
    selectedAreas?: AreaPricing[];
    selectedTier?: PriceTier | null;
    price?: number;
    durationMinutes?: number;
    depositAmount?: number;
  }) => void;
}

interface ReferenceImage {
  _id: string;
  url: string;
}

function getCheapestTierIndex(tiers?: PriceTier[]): number | null {
  if (!tiers?.length) return null;
  return tiers.reduce((minIdx, tier, idx, arr) => {
    const tierPrice = tier.price ?? Number.POSITIVE_INFINITY;
    const minPrice = arr[minIdx].price ?? Number.POSITIVE_INFINITY;
    return tierPrice < minPrice ? idx : minIdx;
  }, 0);
}

export default function ServiceModal({
  service,
  theme,
  username,
  onClose,
  onAddToSummary,
}: ServiceModalProps) {
  const router = useRouter();
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<number | null>(() =>
    getCheapestTierIndex(service.priceTiers)
  );
  const isPortfolioBooking = Boolean(service.portfolioBooking);
  const lockedReferenceId = service.portfolioBooking?.imageId;

  useEffect(() => {
    if (isPortfolioBooking) {
      setReferenceImages([]);
      setSelectedRefs(lockedReferenceId ? [lockedReferenceId] : []);
      return;
    }

    async function fetchRefs() {
      try {
        const res = await axios.get<{ linkedImages: ReferenceImage[] }>(
          `/api/portfolio/link?serviceId=${service._id}`
        );
        setReferenceImages((res.data.linkedImages || []).filter((img) => img.url?.trim()));
      } catch (err) {
        console.error("Failed loading references", err);
      }
    }
    fetchRefs();
  }, [isPortfolioBooking, lockedReferenceId, service._id]);

  const addOns = service.addOns ?? [];
  const sessionPackages = service.sessionPackages ?? [];
  const areaPricing = service.areaPricing ?? [];
  const priceTiers = useMemo(() => service.priceTiers ?? [], [service.priceTiers]);
  const selectedAddOnObjects = selectedAddOns.map((idx) => addOns[Number(idx)]).filter(Boolean) as AddOn[];
  const selectedSessionObjects = selectedSessions
    .map((idx) => sessionPackages[Number(idx)])
    .filter(Boolean) as SessionPackage[];
  const selectedAreaObjects = selectedAreas
    .map((idx) => areaPricing[Number(idx)])
    .filter(Boolean) as AreaPricing[];
  const selectedTierObject = selectedTier !== null ? priceTiers[selectedTier] : null;
  const heroGallery = (service.gallery || []).filter((url): url is string => Boolean(url?.trim()));

  const totalDuration = useMemo(() => {
    const base = service.durationMinutes ?? 0;
    const addOnsDuration = selectedAddOnObjects.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
    const sessionDuration = selectedSessionObjects.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return base + addOnsDuration + sessionDuration;
  }, [service.durationMinutes, selectedAddOnObjects, selectedSessionObjects]);

  const { finalPrice, priceOnRequest, computedDeposit } = useMemo(() => {
    const bundleItemsWithPrice = (service.bundleItems ?? []) as BundleItemWithPrice[];
    const hasBasePrice = typeof service.basePrice === "number" && service.basePrice > 0;
    const hasRangeMin =
      typeof service.priceRange?.min === "number" && (service.priceRange?.min as number) > 0;
    const hasAnyTierPricing = priceTiers.some((tier) => (tier.price ?? 0) > 0);
    const isPriceOnRequest = !hasBasePrice && !hasRangeMin && !hasAnyTierPricing;

    let base = 0;
    if (hasBasePrice) {
      base = service.basePrice as number;
    } else if (hasRangeMin) {
      base = service.priceRange?.min as number;
    } else if ((selectedTierObject?.price ?? 0) > 0) {
      base = selectedTierObject?.price as number;
    }

    if (!isPortfolioBooking) {
      base += selectedAddOnObjects.reduce((sum, a) => sum + (a.price || 0), 0);
      base += selectedSessionObjects.reduce((sum, s) => sum + (s.price || 0), 0);
      base += selectedAreaObjects.reduce((sum, a) => sum + (a.price || a.min || 0), 0);
      if (service.isBundle && bundleItemsWithPrice.length) {
        base += bundleItemsWithPrice.reduce((sum, b) => sum + (b.price || 0), 0);
      }
    }

    let depositAmount: number | undefined;

    if (service.depositOverride?.enabled) {
      const value = service.depositOverride.value || 0;
      depositAmount =
        service.depositOverride.type === "percent"
          ? isPriceOnRequest
            ? undefined
            : Math.round((value / 100) * base)
          : Math.round(value);
    } else if (service.businessDepositPolicy?.enabled) {
      const policyType = service.businessDepositPolicy.type ?? "fixed";
      const policyValue = service.businessDepositPolicy.value ?? 0;
      depositAmount =
        policyType === "percent"
          ? isPriceOnRequest
            ? undefined
            : Math.round((policyValue / 100) * base)
          : Math.round(policyValue);
    }

    return {
      finalPrice: isPriceOnRequest ? null : Math.max(Math.round(base), 0),
      priceOnRequest: isPriceOnRequest,
      computedDeposit: depositAmount,
    };
  }, [
    service,
    priceTiers,
    selectedTierObject,
    selectedAddOnObjects,
    selectedSessionObjects,
    selectedAreaObjects,
    isPortfolioBooking,
  ]);

  const handleAdd = () => {
    const effectiveSelectedRefs =
      selectedRefs.length > 0 ? selectedRefs : lockedReferenceId ? [lockedReferenceId] : [];

    onAddToSummary({
      service,
      selectedRefs: effectiveSelectedRefs,
      isMobile,
      selectedAddOns: selectedAddOnObjects,
      selectedSessions: selectedSessionObjects,
      selectedAreas: selectedAreaObjects,
      selectedTier: selectedTierObject,
      price: priceOnRequest ? undefined : finalPrice ?? undefined,
      durationMinutes: totalDuration || 0,
      depositAmount: computedDeposit,
    });
  };

  const bookingPayload = useMemo(
    () => [
      {
        ...service,
        selectedReferenceImages:
          selectedRefs.length > 0 ? selectedRefs : lockedReferenceId ? [lockedReferenceId] : [],
        selectedRefs: selectedRefs.length > 0 ? selectedRefs : lockedReferenceId ? [lockedReferenceId] : [],
        isMobile,
        selectedAddOns: selectedAddOnObjects,
        selectedSessions: selectedSessionObjects,
        selectedAreas: selectedAreaObjects,
        selectedTier: selectedTierObject,
        price: priceOnRequest ? undefined : finalPrice ?? undefined,
        durationMinutes: totalDuration || service.durationMinutes,
        depositAmount: computedDeposit,
      },
    ],
    [
      computedDeposit,
      finalPrice,
      isMobile,
      priceOnRequest,
      selectedAddOnObjects,
      selectedAreaObjects,
      selectedSessionObjects,
      selectedTierObject,
      service,
      totalDuration,
      lockedReferenceId,
      selectedRefs,
    ]
  );

  const handleBookNow = () => {
    const key = `booking_services_${crypto.randomUUID()}`;
    sessionStorage.setItem(key, JSON.stringify(bookingPayload));
    const bookingUsername = service.username || username;
    if (!bookingUsername) return;
    onClose();
    router.push(`/b/${bookingUsername}/select?key=${key}`);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md">
      <div className="h-full overflow-y-auto p-2 md:p-4">
        <div
          className="mx-auto flex min-h-full max-w-6xl flex-col rounded-2xl border bg-white shadow-2xl md:max-h-[calc(100vh-2rem)] md:min-h-0 md:overflow-hidden"
          style={{ borderColor: "rgba(15,23,42,0.14)" }}
        >
          <div className="sticky top-0 z-20 flex items-start justify-between border-b bg-white px-5 py-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 md:text-3xl">{service.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {formatDuration(totalDuration || service.durationMinutes || 0) || "Duration not set"}
                {priceOnRequest
                  ? " • Price on request"
                  : ` • ${service.currency || "KES"} ${(finalPrice || 0).toLocaleString()}`}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full px-2 py-1 text-lg font-bold text-slate-500 transition hover:bg-slate-100"
            >
              x
            </button>
          </div>

          <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
            <div className="w-full space-y-6 border-b p-5 md:w-1/2 md:overflow-y-auto md:border-b-0 md:border-r">
              {heroGallery.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {heroGallery.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative h-44 w-44 shrink-0 overflow-hidden rounded-2xl border"
                      style={{ borderColor: theme.primaryLight }}
                    >
                      <Image src={url} alt={`${service.name} ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No service images have been added yet. You can still continue and view all pricing and options below.
                </div>
              )}

              {!isPortfolioBooking && referenceImages.length > 0 ? (
                <div>
                  <h4 className="mb-2 font-semibold text-slate-900">
                    Select reference photos
                  </h4>
                  <p className="mb-3 text-sm text-slate-600">
                    You can select any of the previous styles done that you would like to be done for you.
                  </p>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {referenceImages.map((ref) => {
                      const selected = selectedRefs.includes(ref._id);
                      return (
                        <div
                          key={ref._id}
                          onClick={() =>
                            setSelectedRefs((prev) =>
                              prev.includes(ref._id)
                                ? prev.filter((item) => item !== ref._id)
                                : [...prev, ref._id]
                            )
                          }
                          className="relative h-32 cursor-pointer overflow-hidden rounded-xl border transition-all"
                          style={{
                            borderColor: selected ? theme.primary : "transparent",
                            boxShadow: selected ? `0 0 20px ${theme.primaryLight}` : undefined,
                          }}
                        >
                          <Image src={ref.url} alt="Reference" fill className="object-cover" />
                          {selected ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                              <CheckCircle className="h-10 w-10 text-white" />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!isPortfolioBooking && addOns.length > 0 ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">Optional Add-Ons</h4>
                  <div className="flex flex-col gap-2">
                    {addOns.map((addon, idx) => {
                      const selected = selectedAddOns.includes(String(idx));
                      return (
                        <label
                          key={idx}
                          className="flex cursor-pointer justify-between rounded border p-3 transition"
                          style={{
                            background: selected ? `${theme.primaryLight || theme.primary}66` : "transparent",
                            borderColor: selected ? theme.primary : "rgba(15,23,42,0.14)",
                          }}
                        >
                          <span className="text-sm text-slate-800">
                            {addon.title}
                            {addon.durationMinutes > 0
                              ? ` - ${formatDuration(addon.durationMinutes)}`
                              : ""}
                          </span>
                          <span className="text-sm font-medium" style={{ color: theme.primary }}>
                            {addon.price > 0 ? `KES ${addon.price.toLocaleString()}` : ""}
                          </span>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedAddOns((prev) =>
                                prev.includes(String(idx))
                                  ? prev.filter((value) => value !== String(idx))
                                  : [...prev, String(idx)]
                              )
                            }
                            className="ml-2"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!isPortfolioBooking && sessionPackages.length > 0 ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">Session Packages</h4>
                  <div className="space-y-2">
                    {sessionPackages.map((pkg, idx) => {
                      const selected = selectedSessions.includes(String(idx));
                      return (
                        <label
                          key={idx}
                          className="flex cursor-pointer justify-between rounded border p-3 transition"
                          style={{
                            background: selected ? `${theme.primaryLight || theme.primary}66` : "transparent",
                            borderColor: selected ? theme.primary : "rgba(15,23,42,0.14)",
                          }}
                        >
                          <span className="text-sm text-slate-800">{pkg.sessions} Sessions</span>
                          <span className="text-sm font-medium text-slate-800">KES {pkg.price}</span>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedSessions((prev) =>
                                prev.includes(String(idx))
                                  ? prev.filter((value) => value !== String(idx))
                                  : [...prev, String(idx)]
                              )
                            }
                            className="ml-2"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!isPortfolioBooking && areaPricing.length > 0 ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">Area Pricing</h4>
                  <div className="space-y-2">
                    {areaPricing.map((area, idx) => {
                      const selected = selectedAreas.includes(String(idx));
                      return (
                        <label
                          key={idx}
                          className="flex cursor-pointer justify-between rounded border p-3 transition"
                          style={{
                            background: selected ? `${theme.primaryLight || theme.primary}66` : "transparent",
                            borderColor: selected ? theme.primary : "rgba(15,23,42,0.14)",
                          }}
                        >
                          <span className="text-sm text-slate-800">{area.area}</span>
                          <span className="text-sm font-medium text-slate-800">
                            {typeof area.price === "number" ? `KES ${area.price}` : ""}
                          </span>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedAreas((prev) =>
                                prev.includes(String(idx))
                                  ? prev.filter((value) => value !== String(idx))
                                  : [...prev, String(idx)]
                              )
                            }
                            className="ml-2"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!isPortfolioBooking && priceTiers.length > 0 ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">Select Price Tier</h4>
                  <div className="space-y-2">
                    {priceTiers
                      .filter((tier) => (tier.price ?? 0) > 0)
                      .map((tier, idx) => {
                        const selected = selectedTier === idx;
                        return (
                          <label
                            key={idx}
                            className="flex cursor-pointer justify-between rounded border p-3 transition"
                            style={{
                              background: selected ? `${theme.primaryLight || theme.primary}66` : "transparent",
                              borderColor: selected ? theme.primary : "rgba(15,23,42,0.14)",
                            }}
                          >
                            <span className="text-sm text-slate-800">{tier.label}</span>
                            <span className="text-sm font-medium text-slate-800">
                              From KES {tier.price ?? 0}
                            </span>
                            <input
                              type="radio"
                              checked={selected}
                              onChange={() => setSelectedTier(idx)}
                              className="ml-2"
                            />
                          </label>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="w-full space-y-6 p-5 md:w-1/2 md:overflow-y-auto">
              <div>
                <div className="flex flex-wrap gap-2">
                  {service.category ? (
                    <span className="rounded-full border px-2 py-1 text-xs font-semibold text-slate-700">
                      {service.category}
                    </span>
                  ) : null}
                  {service.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-full border px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {service.description ? (
                  <p className="mt-4 text-sm text-slate-600">{service.description}</p>
                ) : null}

                {isPortfolioBooking ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-[#f8f4ee] p-4">
                    <p className="text-sm font-semibold text-slate-900">This is the exact style you will get</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Booking from the portfolio keeps the saved style price and time commitment for this look.
                    </p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-slate-900">
                    {priceOnRequest
                      ? "Price on request"
                      : `${service.currency || "KES"} ${(finalPrice || 0).toLocaleString()}`}
                  </p>
                </div>

                {service.mobileEligible ? (
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={isMobile}
                        onChange={(e) => setIsMobile(e.target.checked)}
                      />
                      Service at customer&apos;s location
                    </label>
                  </div>
                ) : null}

                {service.priceBreakdown ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-slate-900">Price Breakdown</h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {service.priceBreakdown}
                    </p>
                  </div>
                ) : null}
              </div>

              {service.depositOverride?.enabled || service.businessDepositPolicy?.enabled ? (
                <div
                  className="rounded-lg border p-3"
                  style={{ background: `${theme.accentLight || theme.accent}44`, borderColor: "rgba(15,23,42,0.14)" }}
                >
                  <h4 className="mb-1 text-sm font-semibold">Deposit Required</h4>
                  <p className="mb-1 text-xs text-slate-600">
                    A deposit is required to book this service. This deposit counts towards your total service fee.
                  </p>
                  <span className="text-lg font-bold text-slate-900">
                    {typeof computedDeposit === "number"
                      ? `${service.currency || "KES"} ${computedDeposit}`
                      : "Calculated at checkout"}
                  </span>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAdd}
                  className="w-full rounded-xl py-4 text-lg font-bold tracking-wide text-white"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  }}
                >
                  Add to Summary
                </Button>

                <Button
                  onClick={handleBookNow}
                  className="w-full rounded-xl py-4 text-lg font-bold tracking-wide"
                  style={{
                    backgroundColor: theme.accent,
                    color: "white",
                  }}
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
