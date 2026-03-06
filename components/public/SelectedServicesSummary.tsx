"use client";

import { useMemo } from "react";

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
      (acc, s) => {
        acc.price += s.price || 0;
        acc.duration += s.durationMinutes || 0;
        if (s.isMobile) acc.mobileCount += 1;
        return acc;
      },
      { price: 0, duration: 0, mobileCount: 0 }
    );
  }, [services]);

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center text-center p-6 rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
      }}
    >
      <div className="absolute inset-0 bg-white/20 backdrop-blur-md pointer-events-none rounded-xl" />

      <div className="relative w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-white">Selected Services Summary</h2>
        <p className="text-white/90 text-sm mt-1">
          {services.length} service{services.length === 1 ? "" : "s"} selected
        </p>

        <div className="mt-4 space-y-2 text-left">
          {services.map((service) => (
            <div
              key={service._id}
              className="rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-white flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{service.name}</p>
                <p className="text-xs text-white/90">
                  {service.durationMinutes} min{service.isMobile ? " • Mobile" : ""}
                </p>
              </div>
              <p className="font-bold whitespace-nowrap">KES {(service.price || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-white/90">
          <span>Total Duration: {totals.duration} min</span>
          <span>Total: KES {totals.price.toLocaleString()}</span>
          {totals.mobileCount > 0 && <span>Mobile Services: {totals.mobileCount}</span>}
        </div>
      </div>
    </div>
  );
}

