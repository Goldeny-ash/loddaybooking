"use client";

import { useMemo } from "react";
import { formatDuration } from "@/lib/utils/formatDuration";

interface SummaryService {
  _id: string;
  name: string;
  price: number;
  durationMinutes: number;
  isMobile?: boolean;
}

interface Props {
  services: SummaryService[];
  theme: {
    primary: string;
    accent: string;
    brandBgSoft?: string;
  };
}

export default function SelectedServicesSummary({ services, theme }: Props) {
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

            return (
              <div
                key={service._id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-white"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{service.name}</p>
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
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-white/90">
          {formatDuration(totals.duration) ? (
            <span>Total Duration: {formatDuration(totals.duration)}</span>
          ) : null}
          <span>Total: KES {totals.price.toLocaleString()}</span>
          {totals.mobileCount > 0 ? <span>Mobile Services: {totals.mobileCount}</span> : null}
        </div>
      </div>
    </div>
  );
}
