"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import ThemedPopup from "@/components/ThemedPopup";
import { formatDuration } from "@/lib/utils/formatDuration";

interface SelectedAddOn {
  title: string;
  price: number;
  durationMinutes?: number;
}

interface SelectedSession {
  sessions: number;
  price: number;
  durationMinutes?: number;
}

interface SelectedArea {
  area: string;
  min?: number;
  max?: number;
  price?: number;
}

interface SelectedTier {
  label: string;
  price?: number;
}

interface SelectedService {
  _id: string;
  name: string;
  price?: number;
  durationMinutes?: number;
  isMobile?: boolean;
  selectedRefs?: string[];
  selectedAddOns?: SelectedAddOn[];
  selectedSessions?: SelectedSession[];
  selectedAreas?: SelectedArea[];
  selectedTier?: SelectedTier | null;
}

interface Props {
  selectedServices?: SelectedService[];
  status: string;
  theme?: { primary: string; accent: string };
  onRemoveService: (serviceId: string) => void;
  username: string;
}

type PopupState = {
  message: string;
  variant?: "success" | "error";
  mode?: "toast" | "confirm";
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
};

export default function StickyBookingCTA({
  selectedServices = [],
  status,
  theme,
  onRemoveService,
  username,
}: Props) {
  const router = useRouter();
  const disabled = status === "EXPIRED" || status === "INACTIVE";
  const [popup, setPopup] = useState<PopupState | null>(null);

  const totals = useMemo(() => {
    let totalPrice = 0;
    let totalMinutes = 0;

    selectedServices.forEach((service) => {
      totalPrice += Math.max(service.price ?? 0, 0);
      totalMinutes += service.durationMinutes ?? 0;
    });

    return { totalPrice, totalMinutes };
  }, [selectedServices]);

  const handleContinue = () => {
    if (!selectedServices.length) return;

    const key = `booking_services_${uuidv4()}`;
    sessionStorage.setItem(key, JSON.stringify(selectedServices));
    router.push(`/b/${username}/select?key=${key}`);
  };

  const confirmRemove = (serviceId: string, serviceName: string) => {
    setPopup({
      mode: "confirm",
      variant: "error",
      title: "Remove Service",
      message: `Are you sure you want to remove ${serviceName}?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      onConfirm: async () => {
        onRemoveService(serviceId);
        setPopup(null);
      },
    });
  };

  if (!selectedServices.length) return null;

  return (
    <>
      <section className="rounded-xl border bg-white p-5 text-black shadow-md">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="text-2xl font-bold">Selected Services Summary</h2>
          <p className="mt-1 text-sm text-black/70">
            {selectedServices.length} service{selectedServices.length === 1 ? "" : "s"} selected
          </p>

          <div className="mt-4 space-y-2">
            {selectedServices.map((service, index) => {
              const serviceDuration = formatDuration(service.durationMinutes);
              const referenceCount = service.selectedRefs?.length ?? 0;

              return (
                <div
                  key={`${service._id}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{service.name}</p>
                    {serviceDuration ? (
                      <p className="text-xs text-black/70">
                        {serviceDuration}
                        {service.isMobile ? " • Mobile" : ""}
                      </p>
                    ) : service.isMobile ? (
                      <p className="text-xs text-black/70">Mobile</p>
                    ) : null}
                    {referenceCount > 0 ? (
                      <p className="text-xs text-black/60">
                        {referenceCount} reference selection
                        {referenceCount === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="whitespace-nowrap font-bold">
                      KES {(service.price ?? 0).toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => confirmRemove(service._id, service.name)}
                      className="rounded-full p-2 text-red-600 transition hover:bg-red-50"
                      aria-label={`Remove ${service.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-black/80">
            {formatDuration(totals.totalMinutes) ? (
              <span>Total Duration: {formatDuration(totals.totalMinutes)}</span>
            ) : null}
            <span>Total: KES {totals.totalPrice.toLocaleString()}</span>
          </div>

          <Button
            disabled={disabled || selectedServices.length === 0}
            onClick={handleContinue}
            className="mt-5 w-full text-white"
            style={{ backgroundColor: theme?.primary }}
          >
            Continue to Booking
          </Button>
        </div>
      </section>

      <ThemedPopup
        message={popup?.message ?? null}
        onClose={() => setPopup(null)}
        variant={popup?.variant || "success"}
        mode={popup?.mode || "toast"}
        title={popup?.title}
        confirmText={popup?.confirmText}
        cancelText={popup?.cancelText}
        onConfirm={popup?.onConfirm}
      />
    </>
  );
}
