"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence, motion } from "framer-motion";

/* ============================================================
   TYPES
============================================================ */

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

interface Promotion {
  _id: string;
  title: string;
  type: "percent" | "fixed";
  value: number;
}

interface SelectedService {
  _id: string;
  name: string;
  price?: number; // final computed price from modal
  durationMinutes?: number; // final computed duration from modal
  isMobile?: boolean;
  selectedRefs?: string[];
  selectedAddOns?: SelectedAddOn[];
  selectedSessions?: SelectedSession[];
  selectedAreas?: SelectedArea[];
  selectedTier?: SelectedTier | null;
  promotions?: Promotion[];
}

interface Props {
  selectedServices?: SelectedService[];
  status: string;
  theme?: { primary: string; accent: string };
  onRemoveService: (serviceId: string) => void;
  username: string;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function StickyBookingCTA({
  selectedServices = [],
  status,
  theme,
  onRemoveService,
  username,
}: Props) {
  const router = useRouter();
  const disabled = status === "EXPIRED" || status === "INACTIVE";
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ============================================================
     TOTALS (NO RECOMPUTATION LOGIC — TRUST MODAL PRICE)
  ============================================================ */

  const totals = useMemo(() => {
    let totalPrice = 0;
    let totalMinutes = 0;

    selectedServices.forEach((service) => {
      totalPrice += Math.max(service.price ?? 0, 0);
      totalMinutes += service.durationMinutes ?? 0;
    });

    return {
      totalPrice,
      totalMinutes,
    };
  }, [selectedServices]);

  /* ============================================================
     CONTINUE HANDLER
  ============================================================ */

  const handleContinue = () => {
    if (!selectedServices.length) return;

    const key = `booking_services_${uuidv4()}`;
    sessionStorage.setItem(key, JSON.stringify(selectedServices));
    router.push(`/b/${username}/select?key=${key}`);
  };

  /* ============================================================
     AUTO CLOSE MOBILE DRAWER IF EMPTY
  ============================================================ */

  useEffect(() => {
    if (!selectedServices.length) {
      setMobileOpen(false);
    }
  }, [selectedServices.length]);

  /* ============================================================
     MOBILE CTA BAR
  ============================================================ */

  return (
    <>
      {/* MOBILE BOTTOM BAR */}
      <div className="fixed bottom-0 inset-x-0 md:hidden z-50 bg-white border-t shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="text-sm font-semibold">
            {selectedServices.length > 0 ? (
              <>
                {totals.totalMinutes} mins • KES{" "}
                {totals.totalPrice.toLocaleString()}
              </>
            ) : (
              "No services selected"
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedServices.length > 0 && (
              <button
                onClick={() => setMobileOpen(true)}
                className="text-xs underline font-medium"
              >
                View
              </button>
            )}

            <Button
              disabled={disabled || selectedServices.length === 0}
              onClick={handleContinue}
              className="text-white"
              style={{ backgroundColor: theme?.primary }}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================
         MOBILE SLIDE DRAWER
      ============================================================ */}

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50 md:hidden max-h-[85vh] overflow-y-auto p-6"
            >
              <div className="flex justify-between items-center mb-5">
                <h4
                  className="font-semibold text-lg"
                  style={{ color: theme?.primary }}
                >
                  Booking Summary
                </h4>
                <button onClick={() => setMobileOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {selectedServices.map((service, index) => (
                  <div
                    key={`${service._id}-${index}`}
                    className="border-b pb-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {service.name}{" "}
                          {service.isMobile
                            ? "(Customer Location)"
                            : "(At Location)"}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {service.durationMinutes ?? 0} mins • KES{" "}
                          {(service.price ?? 0).toLocaleString()}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {service.selectedRefs?.length ?? 0} refs •{" "}
                          {service.selectedAddOns?.length ?? 0} add-ons
                        </p>
                      </div>

                      <button
                        onClick={() => onRemoveService(service._id)}
                        className="text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 font-semibold text-sm">
                Total: {totals.totalMinutes} mins • KES{" "}
                {totals.totalPrice.toLocaleString()}
              </div>

              <Button
                disabled={disabled}
                onClick={handleContinue}
                className="w-full mt-5 text-white"
                style={{ backgroundColor: theme?.primary }}
              >
                Continue to Booking
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================
         DESKTOP SUMMARY PANEL
      ============================================================ */}

      <AnimatePresence>
        {selectedServices.length > 0 && (
          <motion.aside
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden md:block fixed right-6 top-28 w-80 bg-white border rounded-2xl p-5 shadow-2xl z-40"
          >
            <h4
              className="font-semibold text-lg mb-4"
              style={{ color: theme?.primary }}
            >
              Summary
            </h4>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {selectedServices.map((service, index) => (
                <div
                  key={`${service._id}-${index}`}
                  className="flex justify-between items-start border-b pb-3"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {service.name}{" "}
                      {service.isMobile
                        ? "(Customer Location)"
                        : "(At Location)"}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {service.durationMinutes ?? 0} mins • KES{" "}
                      {(service.price ?? 0).toLocaleString()}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {service.selectedRefs?.length ?? 0} refs •{" "}
                      {service.selectedAddOns?.length ?? 0} add-ons
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveService(service._id)}
                    className="text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 font-semibold text-sm">
              Total: {totals.totalMinutes} mins • KES{" "}
              {totals.totalPrice.toLocaleString()}
            </div>

            <Button
              disabled={disabled}
              onClick={handleContinue}
              className="w-full mt-5 text-white"
              style={{ backgroundColor: theme?.primary }}
            >
              Continue to Booking
            </Button>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
