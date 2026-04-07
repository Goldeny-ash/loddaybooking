"use client";

import { useMemo } from "react";
import { formatDuration } from "@/lib/utils/formatDuration";

interface SummaryService {
  _id: string;
  name: string;
  price: number;
  durationMinutes: number;
  isMobile?: boolean;
  selectedTier?: { label?: string | null } | null;
  selectedAddOns?: { title?: string | null }[] | null;
}

interface Props {
  services: SummaryService[];
  calloutFee?: number;
  calloutFeePending?: boolean;
  depositAmount?: number;
  grandTotal?: number;
  theme: {
    primary: string;
    accent: string;
    brandBgSoft?: string;
  };
}

export default function SelectedServicesSummary({
  services,
  calloutFee = 0,
  calloutFeePending = false,
  depositAmount = 0,
  grandTotal,
  theme,
}: Props) {
  const totals = useMemo(() => {
    return services.reduce(
      (acc, service) => {
        acc.price += service.price || 0;
        acc.duration += service.durationMinutes || 0;
        if (service.isMobile) acc.mobileCount += 1;
        return acc;
      },
      { price: 0, duration: 0, mobileCount: 0 }
    );
  }, [services]);

  const effectiveGrandTotal =
    typeof grandTotal === "number" ? grandTotal : totals.price + Number(calloutFee || 0);

  return (
    <div
      className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl p-6 text-center"
      style={{
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/20 backdrop-blur-md" />

      <div className="relative w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-white">Selected Services Summary</h2>
        <p className="mt-1 text-sm text-white/90">
          {services.length} service{services.length === 1 ? "" : "s"} selected
        </p>

        <div className="mt-4 space-y-2 text-left">
          {services.map((service) => {
            const durationLabel = formatDuration(service.durationMinutes);
            const addOnNames = (service.selectedAddOns || [])
              .map((item) => item.title || "")
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={service._id}
                className="rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{service.name}</p>
                    {service.selectedTier?.label ? (
                      <p className="text-xs text-white/90">Tier: {service.selectedTier.label}</p>
                    ) : null}
                    {addOnNames ? (
                      <p className="text-xs text-white/90">Add-ons: {addOnNames}</p>
                    ) : null}
                    {durationLabel ? (
                      <p className="text-xs text-white/90">
                        {durationLabel}
                        {service.isMobile ? " • Mobile" : ""}
                      </p>
                    ) : service.isMobile ? (
                      <p className="text-xs text-white/90">Mobile</p>
                    ) : null}
                  </div>
                  <p className="whitespace-nowrap font-bold">KES {(service.price || 0).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-2 text-left text-sm text-white/90">
          <p>Services Total: KES {totals.price.toLocaleString()}</p>
          {calloutFee > 0 ? <p>Callout Fee: KES {calloutFee.toLocaleString()}</p> : null}
          {calloutFeePending ? (
            <p>Callout Fee: This per KM fee is calculated once you generate your home location link.</p>
          ) : null}
          {depositAmount > 0 ? <p>Deposit Due: KES {depositAmount.toLocaleString()}</p> : null}
          <p className="font-semibold text-white">Grand Total: KES {effectiveGrandTotal.toLocaleString()}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-white/90">
          {formatDuration(totals.duration) ? (
            <span>Total Duration: {formatDuration(totals.duration)}</span>
          ) : null}
          {totals.mobileCount > 0 ? <span>Mobile Services: {totals.mobileCount}</span> : null}
        </div>
      </div>
    </div>
  );
}
