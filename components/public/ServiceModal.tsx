"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { Service, AddOn, Theme } from "@/components/public/PublicBookingPageClient";
import { motion, AnimatePresence } from "framer-motion";

interface PriceTier {
  label: string;
  min: number;
  max: number;
  price: number;
}

interface SessionPackage {
  sessions: number;
  price: number;
  durationMinutes?: number;
}

interface AreaPricing {
  area: string;
  min: number;
  max: number;
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
  description?: string;
  tags?: string[];
  basePrice?: number;
  priceTiers?: PriceTier[];
  sessionPackages?: SessionPackage[];
  areaPricing?: AreaPricing[];
  bundleItems?: BundleItemWithPrice[];
  depositOverride?: DepositOverride;
};

interface ServiceModalProps {
  service: ModalService;
  theme: Theme;
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
    basePrice?: number;
    durationMinutes?: number;
    depositAmount?: number;
  }) => void;
}

interface ReferenceImage {
  _id: string;
  url: string;
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

function getCheapestTierIndex(tiers?: PriceTier[]): number | null {
  if (!tiers?.length) return null;
  return tiers.reduce(
    (minIdx, tier, idx, arr) => (tier.price < arr[minIdx].price ? idx : minIdx),
    0
  );
}

export default function ServiceModal({
  service,
  theme,
  onClose,
  onAddToSummary,
}: ServiceModalProps) {
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isMobile, setIsMobile] = useState(service.mobileEligible ?? false);

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
            (p.services || []).some((s) =>
              String(typeof s === "string" ? s : s._id) === String(service._id)
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
        setReferenceImages((res.data.linkedImages || []).filter(img => img.url?.trim()));
      } catch (err) {
        console.error("Failed loading references", err);
      }
    }
    fetchRefs();
  }, [service._id]);

  const toggleSelectRef = (id: string) => {
    setSelectedRefs(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const toggleAddOn = (idx: number) => {
    setSelectedAddOns(prev =>
      prev.includes(String(idx)) ? prev.filter(x => x !== String(idx)) : [...prev, String(idx)]
    );
  };
  const toggleSession = (idx: number) => {
    setSelectedSessions(prev =>
      prev.includes(String(idx)) ? prev.filter(x => x !== String(idx)) : [...prev, String(idx)]
    );
  };
  const toggleArea = (idx: number) => {
    setSelectedAreas(prev =>
      prev.includes(String(idx)) ? prev.filter(x => x !== String(idx)) : [...prev, String(idx)]
    );
  };

  const addOns = service.addOns ?? [];
  const sessionPackages = service.sessionPackages ?? [];
  const areaPricing = service.areaPricing ?? [];
  const priceTiers = service.priceTiers ?? [];
  const bundleItemsWithPrice = (service.bundleItems ?? []) as BundleItemWithPrice[];

  const selectedAddOnObjects = selectedAddOns.map(idx => addOns[Number(idx)]).filter(Boolean) as AddOn[];
  const selectedSessionObjects = selectedSessions.map(idx => sessionPackages[Number(idx)]).filter(Boolean);
  const selectedAreaObjects = selectedAreas.map(idx => areaPricing[Number(idx)]).filter(Boolean);
  const selectedTierObject = selectedTier !== null ? service.priceTiers?.[selectedTier] : null;
  const heroGallery = service.gallery?.length ? service.gallery : ["/images/placeholder.png"];

  const totalDuration = useMemo(() => {
    const base = service.durationMinutes ?? 0;
    const addOnsDuration = selectedAddOnObjects.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
    const sessionDuration = selectedSessionObjects.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const areaDuration = selectedAreaObjects.reduce((sum, a) => sum + (a.min || 0), 0);
    const total = base + addOnsDuration + sessionDuration + areaDuration;
    return total > 0 ? total : null;
  }, [service, selectedAddOnObjects, selectedSessionObjects, selectedAreaObjects]);

const {
  rawPrice,
  finalPrice,
  hasPromoDiscount,
  priceAfterPromotions,
} = useMemo(() => {
  // 1️⃣ Compute base price
  let base = service.basePrice || 0;

  if (service.priceRange) base = service.priceRange.min ?? base;
  if (priceTiers.length && selectedTierObject) base = selectedTierObject.price;

  base += selectedAddOnObjects.reduce((sum, a) => sum + (a.price || 0), 0);
  base += selectedSessionObjects.reduce((sum, s) => sum + (s.price || 0), 0);
  base += selectedAreaObjects.reduce((sum, a) => sum + (a.price || a.min || 0), 0);
  if (service.isBundle && bundleItemsWithPrice.length) {
    base += bundleItemsWithPrice.reduce((sum, b) => sum + (b.price || 0), 0);
  }

  const raw = Math.max(base, 0);

  // 2️⃣ Apply promotions
  const applicablePromotions = promotions.filter(p => p.type === "percent" || p.type === "fixed");

// 2️⃣ Apply promotions (FIXED AMOUNT ONLY)
const totalDiscount = promotions.reduce(
  (sum, promo) => sum + (promo.value || 0),
  0
);

const discounted = Math.max(raw - totalDiscount, 0);


  // Save discounted price separately for Promotions Banner
  const priceAfterPromotions = Math.round(discounted);

  // 3️⃣ Apply deposit override (if any)
  let final = discounted;
  if (service.depositOverride?.enabled) {
    const v = service.depositOverride.value || 0;
    final = service.depositOverride.type === "percent" ? (v / 100) * discounted : v;
  }

  const hasPromoDiscount = applicablePromotions.length > 0 && discounted < raw;

  return {
    rawPrice: Math.round(raw),
    finalPrice: Math.round(final),
    hasPromoDiscount,
    priceAfterPromotions,
  };
}, [
  service,
  selectedAddOnObjects,
  selectedSessionObjects,
  selectedAreaObjects,
  selectedTierObject,
  promotions,
]);

const handleMobileToggle = (checked: boolean) => {
  setIsMobile(checked);
 
};


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="relative max-w-6xl w-full rounded-3xl overflow-hidden border shadow-lg bg-white">
        <button onClick={onClose} className="absolute right-6 top-5 text-xl font-bold text-black/70 hover:text-black transition">✕</button>

        <div className="flex flex-col md:flex-row">

          {/* LEFT: Gallery & References */}
          <div className="md:w-1/2 p-6 space-y-6 overflow-y-auto">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {heroGallery.map((url, idx) => (
                <div key={idx} className="relative w-44 h-44 shrink-0 rounded-2xl overflow-hidden border" style={{ borderColor: theme.primaryLight }}>
                  <Image src={url} alt={`${service.name} ${idx}`} fill className="object-cover" />
                </div>
              ))}
            </div>

            {referenceImages.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 tracking-wide" style={{ color: theme.primaryDark }}>Select reference photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {referenceImages.map(ref => {
                    const selected = selectedRefs.includes(ref._id);
                    return (
                      <div key={ref._id} onClick={() => toggleSelectRef(ref._id)}
                        className="relative h-32 rounded-xl cursor-pointer overflow-hidden border transition-all"
                        style={{
                          borderColor: selected ? theme.primary : "transparent",
                          boxShadow: selected ? `0 0 20px ${theme.primaryLight}` : undefined,
                        }}>
                        <Image src={ref.url} alt="Reference" fill className="object-cover" />
                        {selected && <div className="absolute inset-0 bg-black/35 flex items-center justify-center"><CheckCircle className="text-white w-10 h-10" /></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add-Ons Section */}
            {addOns.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Optional Add-Ons</h4>
                <div className="flex flex-col gap-2">
                  {addOns.map((addon, idx) => {
                    const selected = selectedAddOns.includes(String(idx));
                    return (
                      <label key={idx} className={`flex justify-between p-2 rounded border cursor-pointer transition ${selected ? "bg-green-100 border-green-400" : "border-gray-300"}`}>
                        <span>{addon.title} ({addon.durationMinutes} min)</span>
                        <span>KES {addon.price}</span>
                        <input type="checkbox" checked={selected} onChange={() => toggleAddOn(idx)} className="ml-2" />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session Packages */}
            {sessionPackages.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Session Packages</h4>
                {sessionPackages.map((s, idx) => {
                  const selected = selectedSessions.includes(String(idx));
                  return (
                    <label key={idx} className={`flex justify-between p-2 rounded border cursor-pointer transition ${selected ? "bg-green-100 border-green-400" : "border-gray-300"}`}>
                      <span>{s.sessions} Sessions</span>
                      <span>KES {s.price}</span>
                      <input type="checkbox" checked={selected} onChange={() => toggleSession(idx)} className="ml-2" />
                    </label>
                  );
                })}
              </div>
            )}

            {/* Area Pricing */}
            {areaPricing.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Area Pricing</h4>
                {areaPricing.map((a, idx) => {
                  const selected = selectedAreas.includes(String(idx));
                  return (
                    <label key={idx} className={`flex justify-between p-2 rounded border cursor-pointer transition ${selected ? "bg-green-100 border-green-400" : "border-gray-300"}`}>
                      <span>{a.area} ({a.min}-{a.max})</span>
                      <input type="checkbox" checked={selected} onChange={() => toggleArea(idx)} className="ml-2" />
                    </label>
                  );
                })}
              </div>
            )}

            {/* Price Tiers */}
            {priceTiers.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Select Price Tier</h4>
                {priceTiers.map((tier, idx) => {
                  const selected = selectedTier === idx;
                  return (
                    <label key={idx} className={`flex justify-between p-2 rounded border cursor-pointer transition ${selected ? "bg-green-100 border-green-400" : "border-gray-300"}`}>
                      <span>{tier.label} ({tier.min}-{tier.max})</span>
                      <span>From KES {tier.price}</span>
                      <input type="radio" checked={selected} onChange={() => setSelectedTier(idx)} className="ml-2" />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Info & CTA */}
          <div className="md:w-1/2 p-8 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: theme.primaryDark }}>{service.name}</h2>

              {/* Category & Tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 font-semibold">{service.category}</span>
                {service.tags?.map((t, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 rounded-full bg-blue-100 font-semibold">{t}</span>
                ))}
              </div>

              {/* Description */}
              {service.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700">{service.description}</p>
                </div>
              )}

              {/* Price & Duration */}
              <div className="flex items-center gap-3">
                {hasPromoDiscount && (
                  <motion.span
                    key={`raw-${rawPrice}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg line-through text-gray-400"
                  >
                    {service.currency || "KES"} {rawPrice}
                  </motion.span>
                )}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={finalPrice}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-3xl font-extrabold text-black"
                  >
                    {service.currency || "KES"} {rawPrice}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Promotions List */}
              {promotions.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-semibold mb-1 text-sm">Promotions</h4>
                  {promotions.map(promo => (
                    <div key={promo._id} className="flex justify-between p-2 rounded border mb-1">
                      <span>{promo.title || "Promo"}</span>
                      <span>{promo.type === "percent" ? `${promo.value}%` : `KES ${promo.value}`}</span>
                    </div>
                  ))}
                </div>
              )}

{promotions.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                  <h4 className="font-semibold mb-2 text-sm">Price After Promotions</h4>
                  <span className="text-2xl font-extrabold text-black">
                    {service.currency || "KES"} {priceAfterPromotions}
                  </span>
                </div>
              )}


              {service.mobileEligible && (
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isMobile} onChange={(e) => handleMobileToggle(e.target.checked)} />
                  Service at customer&apos;s location
                </label>
              </div>
            )}
</div>



            
{/* Deposit Required */}
{service.depositOverride?.enabled && (
  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
    <h4 className="font-semibold text-sm mb-1">Deposit Required</h4>
    <p className="text-xs text-red-700 mb-1">
      A deposit is required to book this service. This deposit counts towards your total service fee.
    </p>
    <span className="text-lg font-bold text-red-800">
      {service.currency || "KES"}{" "}
      {service.depositOverride.type === "percent"
        ? Math.round((service.depositOverride.value / 100) * finalPrice)
        : service.depositOverride.value}
    </span>
  </div>
)}

            <div className="mt-6 flex flex-col gap-3">
             <Button
  onClick={() => {
    const computedDeposit = service.depositOverride?.enabled
      ? service.depositOverride.type === "percent"
        ? Math.round((service.depositOverride.value / 100) * finalPrice)
        : service.depositOverride.value
      : 0;

    onAddToSummary({
      service,
      selectedRefs,
      isMobile,
      selectedAddOns: selectedAddOnObjects,
      selectedSessions: selectedSessionObjects,
      selectedAreas: selectedAreaObjects,
      selectedTier: selectedTierObject,
      promotions,
      basePrice: rawPrice,
      durationMinutes: totalDuration || 0,
      depositAmount: computedDeposit, // ✅ add depositAmount here
    });
  }}
  className="w-full py-4 text-lg font-bold tracking-wide rounded-xl transition-all"
  style={{
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
    boxShadow: `0 12px 35px ${theme.primaryDark}`,
  }}
>
  Add to Summary
</Button>


              <Button
                onClick={() => {
                  onAddToSummary({
                    service,
                    selectedRefs,
                   isMobile,
                    selectedAddOns: selectedAddOnObjects,
                    selectedSessions: selectedSessionObjects,
                    selectedAreas: selectedAreaObjects,
                    selectedTier: selectedTierObject,
                    promotions,
                    basePrice: rawPrice,
                    durationMinutes: service.durationMinutes || 0,
                  });
                  window.location.href = `/b/${service._id}/select`;
                }}
                className="w-full py-4 text-lg font-bold tracking-wide rounded-xl transition-all"
              >
                Book Now
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
