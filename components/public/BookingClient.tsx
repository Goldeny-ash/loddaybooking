"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PublicBusinessHeader from "./PublicBusinessHeader";
import SelectedServicesSummary from "./SelectedServicesSummary";
import SlotPicker from "./SlotPicker";
import CustomerDetailsForm from "./CustomerDetailsForm";
import ThemedPopup from "@/components/ThemedPopup";
import { getTheme } from "@/lib/theme";
import type { CustomerLocation } from "@/lib/types/customerLocation";

interface CartService {
  _id: string;
  serviceId?: string;
  name: string;
  price: number;
  basePrice?: number;
  durationMinutes: number;
  isMobile?: boolean;
  selectedRefs?: string[];
  selectedAddOns?: { title: string; price: number; durationMinutes: number }[];
  selectedSessions?: { sessions: number; price: number; durationMinutes: number }[];
  selectedAreas?: { area: string; min: number; max?: number; price?: number }[];
  selectedTier?: { label: string; min?: number; max?: number; price?: number } | null;
  promotions?: { _id: string; title: string; type: "percent" | "fixed"; value: number }[];
  depositAmount?: number;
}

interface SlotSelection {
  startTime: string;
  endTime: string;
  staffAssignments?: { staffId?: string }[];
}

interface BookingBusiness {
  _id: string;
  name: string;
  logo?: string;
  bookingRules?: { autoApprove?: boolean };
  [key: string]: unknown;
}

interface BookingClientProps {
  username: string;
  business: BookingBusiness;
}

type PopupState = {
  message: string;
  variant?: "success" | "error";
  title?: string;
};

export default function BookingClient({ username, business }: BookingClientProps) {
  const router = useRouter();
  const theme = useMemo(() => getTheme(business), [business]);

  const [services, setServices] = useState<CartService[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [note, setNote] = useState("");
  const [customerLocation, setCustomerLocation] = useState<CustomerLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  const [popup, setPopup] = useState<PopupState | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");

    if (!key) {
      router.push(`/b/${username}`);
      return;
    }

    const stored = sessionStorage.getItem(key);
    if (!stored) {
      router.push(`/b/${username}`);
      return;
    }

    try {
      setServices(JSON.parse(stored));
    } catch {
      router.push(`/b/${username}`);
    }
  }, [router, username]);

  const depositInfo = useMemo(() => {
    const totalDeposit = services.reduce((sum, service) => sum + (service.depositAmount || 0), 0);
    return { required: totalDeposit > 0, amount: totalDeposit };
  }, [services]);

  const isMobileBooking = useMemo(() => services.some((service) => service.isMobile), [services]);

  const showPopup = useCallback((message: string, variant: "success" | "error" = "error", title?: string) => {
    setPopup({ message, variant, title });
  }, []);

  const handleSlotSelected = useCallback((newSlot: SlotSelection) => setSlot(newSlot), []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setSlot(null);
  }, []);

  const refreshAvailability = useCallback(() => {
    setAvailabilityRefreshKey((current) => current + 1);
    setSlot(null);
  }, []);

  const confirmBooking = async () => {
    if (!customerName.trim()) {
      showPopup("Full name is required.", "error", "Missing field");
      return;
    }

    if (!customerPhone.trim()) {
      showPopup("Phone number is required.", "error", "Missing field");
      return;
    }

    if (!customerEmail.trim()) {
      showPopup("Email is required.", "error", "Missing field");
      return;
    }

    if (!/^07\d{8}$/.test(customerPhone.trim())) {
      showPopup("Enter a valid Kenyan phone number in the format 07XXXXXXXX.", "error", "Invalid phone");
      return;
    }

    if (!slot) {
      showPopup("Please select an available time slot first.", "error", "Missing slot");
      return;
    }

    if (!selectedDate) {
      showPopup("Please select a booking date first.", "error", "Missing date");
      return;
    }

    if (isMobileBooking) {
      if (!customerLocation?.county || !customerLocation?.subCounty) {
        showPopup("County and sub-county are required for mobile services.", "error", "Missing location");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const servicesPayload = services.map((service) => ({
        serviceId: service._id,
        staffId: slot.staffAssignments?.[0]?.staffId,
        durationMinutes: service.durationMinutes,
        price: service.price,
        depositAmount: service.depositAmount || 0,
        selectedReferenceImages: (service.selectedRefs || []).map((id) => ({
          referenceId: id,
          imageIndex: 0,
        })),
        selectedAddOns: service.selectedAddOns,
        selectedSessions: service.selectedSessions,
        selectedAreas: service.selectedAreas,
        selectedTier: service.selectedTier,
        promotions: service.promotions,
        selectedRefs: service.selectedRefs || [],
        isMobile: service.isMobile,
      }));

      const res = await fetch("/api/bookings/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business._id,
          services: servicesPayload,
          date: selectedDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          isMobile: isMobileBooking,
          note,
          customerLocation: isMobileBooking ? customerLocation : undefined,
          promoCode,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        refreshAvailability();
        showPopup(
          "That time slot was just taken. The available slots have been refreshed, please choose another one.",
          "error",
          "Slot unavailable"
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      setPopup({
        message: "The business has received your booking and an email has been sent with further details.",
        variant: "success",
        title: "Booking received",
      });

      window.setTimeout(() => {
        router.replace(`/b/${username}/thank-you?bookingId=${data.bookingId}&token=${data.manageToken}`);
      }, 1200);
    } catch (err: unknown) {
      console.error("Booking POST error:", err);
      const message = err instanceof Error ? err.message : "Failed to create booking";
      setError(message);
      showPopup(message, "error", "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  function hexToRgb(hex: string) {
    const clean = (hex || "").replace("#", "");
    const normalized =
      clean.length === 3
        ? clean
            .split("")
            .map((char) => char + char)
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
    const values = [r, g, b].map((value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
  }

  function getReadableText(background: string) {
    return luminance(background) > 0.55 ? "#000000" : "#ffffff";
  }

  function isLight(hex: string) {
    return luminance(hex) > 0.6;
  }

  function cardFor(background: string) {
    return isLight(background) ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.35)";
  }

  function borderFor(background: string) {
    return isLight(background) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)";
  }

  function shadowFor(background: string) {
    return isLight(background)
      ? "0 20px 50px rgba(0,0,0,0.10)"
      : "0 20px 60px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.05)";
  }

  const gradientBackground = `linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.accentLight} 100%)`;
  const base = theme.primaryLight || "#ffffff";
  const cardBackground = cardFor(base);
  const cardBorder = borderFor(base);
  const cardShadow = shadowFor(base);
  const cardText = getReadableText(base);
  const detailsBackground = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`;
  const primaryText = getReadableText(theme.primary || "#000000");

  return (
    <>
      <div
        className="mx-auto max-w-xl space-y-6 rounded-2xl p-4 md:p-6"
        style={{ background: gradientBackground }}
      >
        <PublicBusinessHeader
          name={business.name}
          logo={business.logo}
          autoApprove={business.bookingRules?.autoApprove}
          depositRequired={depositInfo.required}
          theme={theme}
        />

        {services.length > 0 ? (
          <SelectedServicesSummary
            services={services.map((service) => ({
              _id: service._id,
              name: service.name,
              price: service.price,
              durationMinutes: service.durationMinutes,
              isMobile: service.isMobile,
            }))}
            theme={theme}
          />
        ) : null}

        <div
          className="rounded-2xl p-4"
          style={{
            background: cardBackground,
            color: cardText,
            border: `1px solid ${cardBorder}`,
            boxShadow: cardShadow,
            backdropFilter: "blur(14px)",
          }}
        >
          <SlotPicker
            businessId={String(business._id)}
            serviceIds={services.map((service) => service._id)}
            date={selectedDate}
            onDateChange={handleDateChange}
            onSlotSelected={handleSlotSelected}
            refreshKey={availabilityRefreshKey}
            onSlotUnavailable={() =>
              showPopup(
                "That time slot is no longer available. The list has been refreshed for you.",
                "error",
                "Slot unavailable"
              )
            }
          />
        </div>

        {slot ? (
          <div
            className="space-y-4 rounded-2xl p-4 pt-6"
            style={{
              background: detailsBackground,
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <CustomerDetailsForm
              customerName={customerName}
              customerPhone={customerPhone}
              customerEmail={customerEmail}
              note={note}
              customerLocation={customerLocation || undefined}
              services={services}
              promoCode={promoCode}
              showMobileLocation={isMobileBooking}
              onNameChange={setCustomerName}
              onPhoneChange={setCustomerPhone}
              onEmailChange={setCustomerEmail}
              onNoteChange={setNote}
              onPromoCodeChange={setPromoCode}
              onLocationChange={setCustomerLocation}
              onServiceRefsChange={(serviceId, urls) => {
                setServices((prev) =>
                  prev.map((service) =>
                    service._id === serviceId ? { ...service, selectedRefs: urls } : service
                  )
                );
              }}
            />

            {error ? <p className="text-sm text-red-100">{error}</p> : null}

            <button
              type="button"
              disabled={loading}
              onClick={confirmBooking}
              className="w-full rounded-xl py-2 font-medium disabled:opacity-50"
              style={{ backgroundColor: "#ffffff", color: theme.primary || primaryText }}
            >
              {loading ? "Submitting Booking..." : "Submit Booking"}
            </button>
          </div>
        ) : null}
      </div>

      <ThemedPopup
        message={popup?.message ?? null}
        onClose={() => setPopup(null)}
        variant={popup?.variant || "success"}
        title={popup?.title}
      />
    </>
  );
}
