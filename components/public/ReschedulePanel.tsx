"use client";

import { useEffect, useState, useMemo } from "react";
import SlotPicker from "./SlotPicker";
import CustomerDetailsForm from "./CustomerDetailsForm";
import DepositModal from "./DepositModal";
import PublicBusinessHeader from "./PublicBusinessHeader";

interface Props {
  booking: any;
  token: string;
  onUpdated: (booking: any) => void;
}

export default function ReschedulePanel({ booking, token, onUpdated }: Props) {
  const [slots, setSlots] = useState<any[]>([]);
  const [slot, setSlot] = useState<any>({
    staffId: booking.staffId,
    startTime: booking.startTime,
    endTime: booking.endTime,
  });
  const [selectedDate, setSelectedDate] = useState(booking.date);

  const [customerName, setCustomerName] = useState(booking.customerName);
  const [customerPhone, setCustomerPhone] = useState(booking.customerPhone);
  const [customerEmail, setCustomerEmail] = useState(booking.customerEmail);
  const [note, setNote] = useState(booking.note);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositToken, setDepositToken] = useState<string | null>(null);

  const service = booking.service;
  const business = booking.business;
  const calloutFee = service.callOutFee || 0;

  const locationLink =
    business.location?.lat && business.location?.lng
      ? `https://www.google.com/maps?q=${business.location.lat},${business.location.lng}`
      : business.location?.addressLine
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          business.location.addressLine
        )}`
      : null;

  const depositAmount = useMemo(() => {
    const basePrice = service.price + (business.depositPolicy?.applyToCallout ? calloutFee : 0);

    if (service.depositOverride?.enabled) {
      return service.depositOverride.type === "percent"
        ? Math.round((basePrice * service.depositOverride.value) / 100)
        : service.depositOverride.value;
    }

    if (business.depositPolicy?.enabled) {
      return business.depositPolicy.type === "percent"
        ? Math.round((basePrice * business.depositPolicy.value) / 100)
        : business.depositPolicy.value;
    }

    return 0;
  }, [service, business, calloutFee]);

  const depositRequired = depositAmount > 0;

  const subscriptionValid = useMemo(() => {
    if (!business?.access) return false;
    const now = new Date();
    const { status, trialEndsAt } = business.access;
    if (status === "ACTIVE" || status === "GRACE") return true;
    if (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) >= now)
      return true;
    return false;
  }, [business]);

  // ------------------ LIVE SLOT AVAILABILITY ------------------
  useEffect(() => {
    if (!selectedDate || !service._id || !business._id) return;

    async function fetchAvailability() {
      try {
        const res = await fetch(
          `/api/availability?businessId=${business._id}&serviceId=${service._id}&date=${selectedDate}`
        );
        const data = await res.json();
        setSlots(data.slots || []);
      } catch (err) {
        console.error("Error fetching availability", err);
        setSlots([]);
      }
    }

    fetchAvailability();
  }, [selectedDate, service._id, business._id]);

  // ------------------ RESCHEDULE CUT-OFF ------------------
  const canReschedule = useMemo(() => {
    const now = new Date();
    const bookingTime = new Date(`${booking.date}T${booking.startTime}`);
    return bookingTime.getTime() - now.getTime() > 6 * 60 * 60 * 1000; // 6 hrs
  }, [booking.date, booking.startTime]);

  // ------------------ CONFIRM RESCHEDULE ------------------
  const confirmReschedule = async () => {
    if (!canReschedule) {
      alert("Reschedule not allowed within 6 hours of the appointment");
      return;
    }

    if (!slot) {
      alert("Select a slot first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        bookingId: booking._id,
        token,
        newDate: selectedDate,
        newStaffId: slot.staffId,
        newStartTime: slot.startTime,
        newEndTime: slot.endTime,
        customerName,
        customerPhone,
        customerEmail,
        note,
        calloutFee,
      };

      const res = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reschedule failed");

      if (data.depositRequired && data.depositToken) {
        setDepositToken(data.depositToken);
        setShowDepositModal(true);
        return;
      }

      onUpdated(data.booking);
      alert("Booking rescheduled successfully!");
    } catch (err: any) {
      console.error("Reschedule error:", err);
      setError(err.message || "Failed to reschedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4 space-y-4">
      <PublicBusinessHeader
        name={business.name}
        logo={business.logo}
        autoApprove={business.bookingRules?.autoApprove}
        locationLink={locationLink}
        locationLabel={
          business.location?.addressLine ||
          (business.location?.lat && business.location?.lng
            ? `${business.location.lat}, ${business.location.lng}`
            : undefined)
        }
        depositRequired={depositRequired}
      />

      <SlotPicker
        businessId={business._id}
        serviceIds={service._id}
        date={selectedDate}
        onDateChange={setSelectedDate}
        onSlotSelected={setSlot}
      />

      {slot && (
        <div className="border-t pt-6 space-y-4">
          <CustomerDetailsForm
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            note={note}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
            onEmailChange={setCustomerEmail}
            onNoteChange={setNote}
            services={[service]}
            onLocationChange={() => {}}
            onServiceRefsChange={() => {}}
          />

          <div className="text-sm text-gray-600">
            Original: {booking.date} {booking.startTime} – {booking.endTime}
            <br />
            New: {selectedDate} {slot.startTime} – {slot.endTime}
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <button
            disabled={!subscriptionValid || loading || !canReschedule}
            onClick={confirmReschedule}
            className="w-full py-2 rounded-xl text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {loading
              ? "Rescheduling..."
              : subscriptionValid
              ? "Confirm Reschedule"
              : "Business Offline"}
          </button>

          {depositRequired && (
            <p className="text-sm">Deposit required: KES {depositAmount}</p>
          )}

          {calloutFee > 0 && <p className="text-sm">Call-out fee: KES {calloutFee}</p>}
        </div>
      )}

      {showDepositModal && depositToken && (
        <DepositModal
          bookingId={booking._id}
          token={depositToken}
          amount={depositAmount}
          serviceName={service.name}
          calloutFee={calloutFee}
          onSuccess={() => onUpdated({ ...booking, ...slot })}
          onClose={() => setShowDepositModal(false)}
        />
      )}
    </div>
  );
}
