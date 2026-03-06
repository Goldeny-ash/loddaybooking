"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { Service, AddOn, Theme } from "@/components/public/PublicBookingPageClient";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

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

interface PromotionServiceRef {
  _id?: string;
}

interface Promotion {
  _id: string;
  title: string;
  type: "percent" | "fixed" | string;
  value: number;
  services?: Array<string | PromotionServiceRef>;
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
    promotions?: Promotion[];
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
    const t = tier.price ?? Number.POSITIVE_INFINITY;
    const m = arr[minIdx].price ?? Number.POSITIVE_INFINITY;
    return t < m ? idx : minIdx;
  }, 0);
}

export default function ServiceModal({
  service,
  theme,
  username,
  onClose,
  onAddToSummary,
}: ServiceModalProps) {
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<number | null>(() =>
    getCheapestTierIndex(service.priceTiers)
  );

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const res = await axios.get<{ success?: boolean; promotions?: Promotion[] }>("/api/promotions");
        if (res.data?.success) {
          const linkedPromos = (res.data.promotions || []).filter((p) =>
            (p.services || []).some(
              (s) => String(typeof s === "string" ? s : s._id) === String(service._id)
            )
          );
          setPromotions(linkedPromos);
        }
      } catch (err) {
        console.error("Failed to fetch promotions", err);
      }
    }
    fetchPromotions();
  }, [service._id]);

  useEffect(() => {
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
  }, [service._id]);

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
  const heroGallery = service.gallery?.length ? service.gallery : ["/images/placeholder.png"];
  const headingText = "#0f172a";
  const bodyText = "#0f172a";
  const mutedText = "rgba(15,23,42,0.72)";
  const modalSurface = "#ffffff";
  const cardSurface = "#ffffff";
  const borderColor = "rgba(15,23,42,0.14)";
  const modalBg = "#ffffff";

  const totalDuration = useMemo(() => {
    const base = service.durationMinutes ?? 0;
    const addOnsDuration = selectedAddOnObjects.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
    const sessionDuration = selectedSessionObjects.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const areaDuration = selectedAreaObjects.reduce((sum) => sum, 0);
    const total = base + addOnsDuration + sessionDuration + areaDuration;
    return total > 0 ? total : null;
  }, [service, selectedAddOnObjects, selectedSessionObjects, selectedAreaObjects]);

  const { rawPrice, priceAfterPromotions, finalPrice, hasPromoDiscount, priceOnRequest, computedDeposit } =
    useMemo(() => {
      const bundleItemsWithPrice = (service.bundleItems ?? []) as BundleItemWithPrice[];
      const hasBasePrice = typeof service.basePrice === "number" && service.basePrice > 0;
      const hasRangeMin =
        typeof service.priceRange?.min === "number" && (service.priceRange?.min as number) > 0;
      const hasAnyTierPricing = priceTiers.some((tier) => (tier.price ?? 0) > 0);
      const priceOnRequest = !hasBasePrice && !hasRangeMin && !hasAnyTierPricing;

      let base = 0;
      if (hasBasePrice) {
        base = service.basePrice as number;
      } else if (hasRangeMin) {
        base = service.priceRange?.min as number;
      } else if ((selectedTierObject?.price ?? 0) > 0) {
        base = selectedTierObject?.price as number;
      }

      base += selectedAddOnObjects.reduce((sum, a) => sum + (a.price || 0), 0);
      base += selectedSessionObjects.reduce((sum, s) => sum + (s.price || 0), 0);
      base += selectedAreaObjects.reduce((sum, a) => sum + (a.price || a.min || 0), 0);
      if (service.isBundle && bundleItemsWithPrice.length) {
        base += bundleItemsWithPrice.reduce((sum, b) => sum + (b.price || 0), 0);
      }
      const raw = Math.max(base, 0);

      const applicablePromotions = promotions.filter(
        (promo) => promo.type === "percent" || promo.type === "fixed"
      );
      const discounted = applicablePromotions.reduce((running, promo) => {
        const value = promo.value || 0;
        if (promo.type === "percent") return Math.max(running - (running * value) / 100, 0);
        return Math.max(running - value, 0);
      }, raw);

      let computedDeposit: number | undefined;

if (service.depositOverride?.enabled) {
  const value = service.depositOverride.value || 0;

  if (service.depositOverride.type === "percent") {
    computedDeposit = priceOnRequest
      ? undefined
      : Math.round((value / 100) * discounted);
  } else {
    computedDeposit = Math.round(value);
  }

} else if (service.businessDepositPolicy?.enabled) {

  const policy = service.businessDepositPolicy;
  const policyType = policy.type ?? "fixed";
  const policyValue = policy.value ?? 0;

  if (policyType === "percent") {
    computedDeposit = priceOnRequest
      ? undefined
      : Math.round((policyValue / 100) * discounted);
  } else {
    computedDeposit = Math.round(policyValue);
  }

}

      return {
        rawPrice: Math.round(raw),
        priceAfterPromotions: Math.round(discounted),
        finalPrice: priceOnRequest ? null : Math.round(discounted),
        hasPromoDiscount: applicablePromotions.length > 0 && discounted < raw,
        priceOnRequest,
        computedDeposit,
      };
    }, [
      service,
      priceTiers,
      selectedTierObject,
      selectedAddOnObjects,
      selectedSessionObjects,
      selectedAreaObjects,
      promotions,
    ]);

  const handleAdd = () => {
    onAddToSummary({
      service,
      selectedRefs,
      isMobile,
      selectedAddOns: selectedAddOnObjects,
      selectedSessions: selectedSessionObjects,
      selectedAreas: selectedAreaObjects,
      selectedTier: selectedTierObject,
      promotions,
      price: priceOnRequest ? undefined : finalPrice ?? undefined,
      durationMinutes: totalDuration || 0,
      depositAmount: computedDeposit,
    });
  };

  const handleBookNow = () => {
    const payload = [
      {
        ...service,
        selectedRefs,
        isMobile,
        selectedAddOns: selectedAddOnObjects,
        selectedSessions: selectedSessionObjects,
        selectedAreas: selectedAreaObjects,
        selectedTier: selectedTierObject,
        promotions,
        price: priceOnRequest ? undefined : finalPrice ?? undefined,
        durationMinutes: totalDuration || service.durationMinutes,
        depositAmount: computedDeposit,
      },
    ];
    const key = `booking_services_${crypto.randomUUID()}`;
    sessionStorage.setItem(key, JSON.stringify(payload));
    const bookingUsername = service.username || username;
    if (!bookingUsername) return;
    window.location.href = `/b/${bookingUsername}/select?key=${key}`;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md">
      <div className="absolute inset-2 md:inset-4 rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor }}>
      <div
        className="relative w-full h-full overflow-hidden rounded-2xl"
        style={{ background: modalBg, color: bodyText }}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-5 z-30 text-xl font-bold transition"
          style={{ color: mutedText }}
        >
          x
        </button>

        <div
          className="md:hidden sticky top-0 z-20 px-5 py-4 border-b"
          style={{ borderColor, background: modalSurface }}
        >
          <h2 className="text-xl font-bold" style={{ color: headingText }}>
            {service.name}
          </h2>
          <p className="text-sm mt-1" style={{ color: mutedText }}>
            {totalDuration ? `${totalDuration} min` : `${service.durationMinutes || 0} min`}
          </p>
          <p className="text-lg font-extrabold mt-1" style={{ color: headingText }}>
            {priceOnRequest
              ? "Price on request"
              : `${service.currency || "KES"} ${(finalPrice || 0).toLocaleString()}`}
          </p>
        </div>

        <div className="flex h-full flex-col md:flex-row pt-16 md:pt-0 rounded-2xl overflow-hidden">
          <div
            className="order-2 md:order-1 md:w-1/2 p-6 space-y-6 overflow-y-auto"
            style={{ background: cardSurface, borderRight: `1px solid ${borderColor}` }}
          >
            <div className="flex gap-3 overflow-x-auto pb-2">
              {heroGallery.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-44 h-44 shrink-0 rounded-2xl overflow-hidden border"
                  style={{ borderColor: theme.primaryLight }}
                >
                  <Image src={url} alt={`${service.name} ${idx}`} fill className="object-cover" />
                </div>
              ))}
            </div>

            {referenceImages.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 tracking-wide" style={{ color: headingText }}>
                  Select reference photos
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {referenceImages.map((ref) => {
                    const selected = selectedRefs.includes(ref._id);
                    return (
                      <div
                        key={ref._id}
                        onClick={() =>
                          setSelectedRefs((prev) =>
                            prev.includes(ref._id)
                              ? prev.filter((x) => x !== ref._id)
                              : [...prev, ref._id]
                          )
                        }
                        className="relative h-32 rounded-xl cursor-pointer overflow-hidden border transition-all"
                        style={{
                          borderColor: selected ? theme.primary : "transparent",
                          boxShadow: selected ? `0 0 20px ${theme.primaryLight}` : undefined,
                        }}
                      >
                        <Image src={ref.url} alt="Reference" fill className="object-cover" />
                        {selected && (
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                            <CheckCircle className="text-white w-10 h-10" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {addOns.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Optional Add-Ons</h4>
                <div className="flex flex-col gap-2">
                  {addOns.map((addon, idx) => {
                    const selected = selectedAddOns.includes(String(idx));
                    return (
                      <label
                        key={idx}
                        className="flex justify-between p-2 rounded border cursor-pointer transition"
                        style={{
                          background: selected ? `${theme.primaryLight || theme.primary}66` : "transparent",
                          borderColor: selected ? theme.primary : borderColor,
                          color: bodyText,
                        }}
                      >
                        <span>
                          {addon.title}
                          {addon.durationMinutes > 0 && ` - ${addon.durationMinutes} min`}
                        </span>
                        <span style={{ color: theme.primary }}>
                          {addon.price > 0 ? `KES ${addon.price.toLocaleString()}` : ""}
                        </span>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setSelectedAddOns((prev) =>
                              prev.includes(String(idx))
                                ? prev.filter((x) => x !== String(idx))
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
            )}

            {sessionPackages.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Session Packages</h4>
                {sessionPackages.map((s, idx) => {
                  const selected = selectedSessions.includes(String(idx));
                  return (
                    <label
                      key={idx}
                      className="flex justify-between p-2 rounded border cursor-pointer transition"
                      style={{
                        background: selected ? `${theme.primaryLight || theme.primary}66` : "transparent",
                        borderColor: selected ? theme.primary : borderColor,
                        color: bodyText,
                      }}
                    >
                      <span>{s.sessions} Sessions</span>
                      <span>KES {s.price}</span>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setSelectedSessions((prev) =>
                            prev.includes(String(idx))
                              ? prev.filter((x) => x !== String(idx))
                              : [...prev, String(idx)]
                          )
                        }
                        className="ml-2"
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {areaPricing.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Area Pricing</h4>
                {areaPricing.map((a, idx) => {
                  const selected = selectedAreas.includes(String(idx));
                  return (
                    <label
                      key={idx}
                      className="flex justify-between p-2 rounded border cursor-pointer transition"
                      style={{
                        background: selected ? `${theme.primaryLight || theme.primary}66` : "transparent",
                        borderColor: selected ? theme.primary : borderColor,
                        color: bodyText,
                      }}
                    >
                      <span>
                        {a.area}
                      </span>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setSelectedAreas((prev) =>
                            prev.includes(String(idx))
                              ? prev.filter((x) => x !== String(idx))
                              : [...prev, String(idx)]
                          )
                        }
                        className="ml-2"
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {priceTiers.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Select Price Tier</h4>
                {priceTiers
                  .filter((tier) => (tier.price ?? 0) > 0)
                  .map((tier, idx) => {
                    const selected = selectedTier === idx;
                    return (
                      <label
                        key={idx}
                        className="flex justify-between p-2 rounded border cursor-pointer transition"
                        style={{
                          background: selected ? `${theme.primaryLight || theme.primary}66` : "transparent",
                          borderColor: selected ? theme.primary : borderColor,
                          color: bodyText,
                        }}
                      >
                        <span>
                          {tier.label}
                        </span>
                        <span>From KES {tier.price ?? 0}</span>
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
            )}
          </div>

          <div className="order-1 md:order-2 md:w-1/2 p-5 md:p-8 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div>
              <h2 className="hidden md:block text-3xl font-bold" style={{ color: headingText }}>
                {service.name}
              </h2>

              <div className="flex flex-wrap gap-2 mt-2">
                {service.category && (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ background: cardSurface, border: `1px solid ${borderColor}` }}
                  >
                    {service.category}
                  </span>
                )}
                {service.tags?.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ background: cardSurface, border: `1px solid ${borderColor}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              {service.description && (
                <div className="mt-4">
                  <p className="text-sm" style={{ color: mutedText }}>
                    {service.description}
                  </p>
                </div>
              )}

              <div className="hidden md:flex items-center gap-3">
                {!priceOnRequest && hasPromoDiscount && (
                  <motion.span
                    key={`raw-${rawPrice}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg line-through"
                    style={{ color: mutedText }}
                  >
                    {service.currency || "KES"} {rawPrice}
                  </motion.span>
                )}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={priceAfterPromotions}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-3xl font-extrabold"
                    style={{ color: headingText }}
                  >
                    {priceOnRequest
                      ? "Price on request"
                      : `${service.currency || "KES"} ${priceAfterPromotions.toLocaleString()}`}
                  </motion.span>
                </AnimatePresence>
              </div>

              {promotions.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-semibold mb-1 text-sm">Promotions</h4>
                  {promotions.map((promo) => (
                    <div
                      key={promo._id}
                      className="flex justify-between p-2 rounded border mb-1"
                      style={{ borderColor, background: cardSurface }}
                    >
                      <span>{promo.title || "Promo"}</span>
                      <span>
                        {promo.type === "percent" ? `${promo.value}%` : `KES ${promo.value}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {promotions.length > 0 && !priceOnRequest && (
                <div
                  className="mt-4 p-4 rounded-lg border"
                  style={{
                    background: `${theme.accentLight || theme.accent}55`,
                    borderColor: theme.accent,
                  }}
                >
                  <h4 className="font-semibold mb-2 text-sm">Price After Promotions</h4>
                  <span className="text-2xl font-extrabold" style={{ color: headingText }}>
                    {service.currency || "KES"} {priceAfterPromotions}
                  </span>
                </div>
              )}

              {service.mobileEligible && (
                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isMobile}
                      onChange={(e) => setIsMobile(e.target.checked)}
                    />
                    Service at customer&apos;s location
                  </label>
                </div>
              )}
            </div>

            {(service.depositOverride?.enabled || service.businessDepositPolicy?.enabled) && (
              <div
                className="mt-2 p-3 border rounded-lg"
                style={{ background: `${theme.accentLight || theme.accent}44`, borderColor }}
              >
                <h4 className="font-semibold text-sm mb-1">Deposit Required</h4>
                <p className="text-xs mb-1" style={{ color: mutedText }}>
                  A deposit is required to book this service. This deposit counts towards your total
                  service fee.
                </p>
                <span className="text-lg font-bold" style={{ color: headingText }}>
                  {typeof computedDeposit === "number"
                    ? `${service.currency || "KES"} ${computedDeposit}`
                    : "Calculated at checkout"}
                </span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={handleAdd}
                className="w-full py-4 text-lg font-bold tracking-wide rounded-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  boxShadow: `0 12px 35px ${theme.primaryDark}`,
                }}
              >
                Add to Summary
              </Button>

              <Button
                onClick={handleBookNow}
                className="w-full py-4 text-lg font-bold tracking-wide rounded-xl"
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
