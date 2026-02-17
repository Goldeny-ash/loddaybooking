"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface SelectedService {
  _id: string;
  name: string;
  basePrice?: number;
  price?: number;
  durationMinutes: number;
  isMobile?: boolean;
  selectedRefs?: string[];
  selectedAddOns?: { title: string; price: number; durationMinutes: number }[];
  selectedSessions?: { sessions: number; price: number; durationMinutes: number }[];
  selectedAreas?: { area: string; min: number; max?: number; price?: number }[];
  selectedTier?: { label: string; price: number };
  promotions?: { _id: string; title: string; type: "percent" | "fixed"; value: number }[];
}

interface Props {
  selectedServices?: SelectedService[];
  status: string;
  theme?: { primary: string; accent: string };
  onRemoveService: (serviceId: string) => void;
  username: string;
}

export default function StickyBookingCTA({
  selectedServices = [],
  status,
  theme,
  onRemoveService,
  username,
}: Props) {
  const router = useRouter();
  const disabled = status === "EXPIRED" || status === "INACTIVE";

  const totals = useMemo(() => {
    let totalPrice = 0;
    let totalMinutes = 0;

    selectedServices.forEach(s => {
      let price = s.basePrice || s.price || 0;
      let duration = s.durationMinutes || 0;

      if (s.selectedAddOns?.length) {
        price += s.selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);
        duration += s.selectedAddOns.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      }

      if (s.selectedSessions?.length) {
        price += s.selectedSessions.reduce((sum, a) => sum + (a.price || 0), 0);
        duration += s.selectedSessions.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      }

      if (s.selectedAreas?.length) {
        price += s.selectedAreas.reduce((sum, a) => sum + (a.price || a.min || 0), 0);
        duration += s.selectedAreas.reduce((sum, a) => sum + (a.min || 0), 0);
      }

      if (s.selectedTier?.price) price += s.selectedTier.price;

      if (s.promotions?.length) {
        s.promotions.forEach(p => {
          if (p.type === "percent") price *= 1 - (p.value || 0) / 100;
          else if (p.type === "fixed") price -= p.value || 0;
        });
      }

      totalPrice += Math.max(price, 0);
      totalMinutes += duration;
    });

    return { totalPrice, totalMinutes };
  }, [selectedServices]);

  const handleContinue = () => {
    if (!selectedServices.length) return;

    // Generate a unique key for sessionStorage
    const key = `booking_services_${uuidv4()}`;
    sessionStorage.setItem(key, JSON.stringify(selectedServices));

    router.push(`/b/${username}/select?key=${key}`);
  };

  return (
    <>
      {/* MOBILE CTA */}
      <div className="fixed bottom-0 inset-x-0 md:hidden z-50 p-3 bg-white border-t">
        <button
          disabled={disabled || selectedServices.length === 0}
          onClick={handleContinue}
          className="w-full py-3 rounded-xl font-semibold text-white transition"
          style={{ backgroundColor: theme?.primary }}
        >
          {selectedServices.length > 0
            ? `Continue • ${totals.totalMinutes} mins • KES ${totals.totalPrice} • ${selectedServices.reduce((sum, s) => sum + (s.selectedRefs?.length || 0), 0)} refs`
            : "Select a service to continue"}
        </button>
      </div>

      {/* DESKTOP SUMMARY */}
      <aside className="hidden md:block sticky top-24 w-80 h-fit border rounded-xl p-4 space-y-3 bg-white shadow left-4">
        <h4 className="font-semibold text-lg" style={{ color: theme?.primary }}>
          Summary
        </h4>

        {selectedServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services selected yet</p>
        ) : (
          <>
            <ul className="space-y-2">
              {selectedServices.map((s, idx) => (
                <li key={`${s._id}-${idx}`} className="flex justify-between items-center text-sm border-b pb-1">
                  <div>
                    <p className="font-medium">{s.name} {s.isMobile ? "(Customer Location)" : "(At Location)"}</p>
                    <p className="text-xs text-gray-500">
                      {s.durationMinutes} mins • KES {s.price || 0} • {s.selectedRefs?.length || 0} refs •
                      {s.selectedAddOns?.length || 0} add-ons • {s.selectedSessions?.length || 0} sessions • {s.selectedAreas?.length || 0} areas
                    </p>
                  </div>
                  <button onClick={() => onRemoveService(s._id)} className="text-red-500 hover:text-red-700 transition" title="Remove service">
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="text-sm font-medium mt-2">
              Total: {totals.totalMinutes} mins • KES {totals.totalPrice}
            </div>

            <Button
              disabled={disabled || selectedServices.length === 0}
              onClick={handleContinue}
              className="w-full py-2 mt-2 text-white font-medium transition"
              style={{ backgroundColor: theme?.primary }}
            >
              Continue to Booking
            </Button>
          </>
        )}
      </aside>
    </>
  );
}
