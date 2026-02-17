"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import PublicBusinessHeader from "./PublicBusinessHeader";
import SlotPicker from "./SlotPicker";
import CustomerDetailsForm from "./CustomerDetailsForm";

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

interface BookingClientProps {
  username: string;
  business: any;
}

export default function BookingClient({ username, business }: BookingClientProps) {
  const router = useRouter();

  const [services, setServices] = useState<CartService[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slot, setSlot] = useState<any>(null);
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

  const totalCalloutFee = useMemo(
    () =>
      services.reduce((sum, s) => (s.isMobile ? s.selectedTier?.price || s.price || 0 : 0) + sum, 0),
    [services]
  );

  const depositInfo = useMemo(() => {
  const totalDeposit = services.reduce((sum, s) => sum + (s.depositAmount || 0), 0);
  return { required: totalDeposit > 0, amount: totalDeposit };
}, [services]);


  const handleSlotSelected = useCallback((newSlot: any) => setSlot(newSlot), []);
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
  } catch (err: any) {
    console.error("Booking POST error:", err);
    setError(err.message || "Failed to create booking");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <PublicBusinessHeader
        name={business.name}
        logo={business.logo}
        autoApprove={business.bookingRules?.autoApprove}
        depositRequired={depositInfo.required}
      />

      <SlotPicker
        businessId={business._id}
        serviceIds={services.map((s) => s._id)}
        date={selectedDate}
        onDateChange={handleDateChange}
        onSlotSelected={handleSlotSelected}
      />

      {slot && (
        <div className="border-t pt-6 space-y-4">
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
            className="w-full py-2 rounded-xl text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {loading ? "Submitting Booking..." : "Submit Booking"}
          </button>
        </div>
      )}
    </div>
  );
}

