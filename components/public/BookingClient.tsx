"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import PublicBusinessHeader from "./PublicBusinessHeader";
import SelectedServicesSummary from "./SelectedServicesSummary";
import SlotPicker from "./SlotPicker";
import CustomerDetailsForm from "./CustomerDetailsForm";
import { getTheme } from "@/lib/theme";

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
  selectedTier?: { label: string; price: number };
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

export default function BookingClient({ username, business }: BookingClientProps) {
  const router = useRouter();
  const theme = useMemo(() => getTheme(business), [business]);

  const [services, setServices] = useState<CartService[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [note, setNote] = useState("");
  const [customerLocation, setCustomerLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    if (!key) {
      alert("No selected services found. Please select services again.");
      router.push(`/b/${username}`);
      return;
    }
    const stored = sessionStorage.getItem(key);
    if (!stored) {
      alert("Your selected services could not be loaded. Please select services again.");
      router.push(`/b/${username}`);
      return;
    }
    try {
      setServices(JSON.parse(stored));
    } catch {
      alert("Failed to load your selected services. Please select again.");
      router.push(`/b/${username}`);
    }
  }, [router, username]);

  const depositInfo = useMemo(() => {
  const totalDeposit = services.reduce((sum, s) => sum + (s.depositAmount || 0), 0);
  return { required: totalDeposit > 0, amount: totalDeposit };
}, [services]);


  const handleSlotSelected = useCallback((newSlot: SlotSelection) => setSlot(newSlot), []);
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setSlot(null);
  }, []);

  const confirmBooking = async () => {
  if (!customerName || !/^07\d{8}$/.test(customerPhone)) {
    alert("Enter a valid Kenyan phone number (07XXXXXXXX)");
    return;
  }
  if (!slot) {
    alert("Select a slot first");
    return;
  }
  if (!selectedDate) {
    alert("Select a date");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const servicesPayload = services.map((s) => {
     

      return {
        serviceId: s._id,
        staffId: slot.staffAssignments?.[0]?.staffId,
        durationMinutes: s.durationMinutes,
        price: s.price,
        depositAmount: s.depositAmount || 0,
        selectedReferenceImages: (s.selectedRefs || []).map((id) => ({ referenceId: id, imageIndex: 0 })),
        selectedAddOns: s.selectedAddOns,
        selectedSessions: s.selectedSessions,
        selectedAreas: s.selectedAreas,
        selectedTier: s.selectedTier,
        promotions: s.promotions,
        selectedRefs: s.selectedRefs || [],
      };
    });

    const isMobileBooking = services.some((s) => s.isMobile);
    const locationPayload = isMobileBooking ? customerLocation : undefined;

    const res = await fetch("/api/bookings/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business._id,
        services: servicesPayload,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        customerName,
        customerPhone,
        customerEmail,
         isMobile: isMobileBooking,

        note,
        customerLocation: locationPayload,
        promoCode,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Booking failed");

    router.push(`/b/${username}/thank-you?bookingId=${data.bookingId}&token=${data.manageToken}`);
  } catch (err: unknown) {
    console.error("Booking POST error:", err);
    setError(err instanceof Error ? err.message : "Failed to create booking");
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
            .map((c) => c + c)
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
    const a = [r, g, b].map((v) => {
      const val = v / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  function getReadableText(bg: string) {
    return luminance(bg) > 0.55 ? "#000000" : "#ffffff";
  }

  function isLight(hex: string) {
    return luminance(hex) > 0.6;
  }

  function cardFor(bg: string) {
    return isLight(bg) ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.35)";
  }

  function borderFor(bg: string) {
    return isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)";
  }

  function shadowFor(bg: string) {
    return isLight(bg)
      ? "0 20px 50px rgba(0,0,0,0.10)"
      : "0 20px 60px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.05)";
  }

  const gradientBg = `linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.accentLight} 100%)`;
  const base = theme.primaryLight || "#ffffff";
  const cardBg = cardFor(base);
  const cardBorder = borderFor(base);
  const cardShadow = shadowFor(base);
  const cardText = getReadableText(base);
  const primaryText = getReadableText(theme.primary || "#000000");

  return (
    <div className="space-y-6 max-w-xl mx-auto p-4 md:p-6 rounded-2xl" style={{ background: gradientBg }}>
      <PublicBusinessHeader
        name={business.name}
        logo={business.logo}
        autoApprove={business.bookingRules?.autoApprove}
        depositRequired={depositInfo.required}
        theme={theme}
      />

      {services.length > 0 && (
        <SelectedServicesSummary
          services={services.map((s) => ({
            _id: s._id,
            name: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            isMobile: s.isMobile,
          }))}
          theme={theme}
        />
      )}

      <div
        className="rounded-2xl p-4"
        style={{
          background: cardBg,
          color: cardText,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          backdropFilter: "blur(14px)",
        }}
      >
        <SlotPicker
          businessId={business._id}
          serviceIds={services.map((s) => s._id)}
          date={selectedDate}
          onDateChange={handleDateChange}
          onSlotSelected={handleSlotSelected}
        />
      </div>

      {slot && (
        <div
          className="pt-6 space-y-4 rounded-2xl p-4"
          style={{
            background: cardBg,
            color: cardText,
            border: `1px solid ${cardBorder}`,
            boxShadow: cardShadow,
            backdropFilter: "blur(14px)",
          }}
        >
          <CustomerDetailsForm
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            note={note}
            customerLocation={customerLocation || undefined}
            services={services}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
            onEmailChange={setCustomerEmail}
            onNoteChange={setNote}
            promoCode={promoCode}
  onPromoCodeChange={setPromoCode}
            onLocationChange={setCustomerLocation}
            onServiceRefsChange={(serviceId, urls) => {
              setServices((prev) =>
                prev.map((s) => (s._id === serviceId ? { ...s, selectedRefs: urls } : s))
              );
            }}
          />

          {error && <p className="text-red-600">{error}</p>}

          <button
            type="button"
            disabled={loading}
            onClick={confirmBooking}
            className="w-full py-2 rounded-xl font-medium disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: primaryText }}
          >
            {loading ? "Submitting Booking..." : "Submit Booking"}
          </button>
        </div>
      )}
    </div>
  );
}

