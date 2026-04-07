"use client";

import { useMemo, useState } from "react";
import SlotPicker from "./SlotPicker";
import CustomerDetailsForm from "./CustomerDetailsForm";
import DepositModal from "./DepositModal";
import PublicBusinessHeader from "./PublicBusinessHeader";
import { computeCalloutCharge } from "@/lib/booking/utils";

interface Props {
  booking: any;
  token: string;
  onUpdated: (booking: any) => void;
}

export default function ReschedulePanel({ booking, token, onUpdated }: Props) {
  const [slot, setSlot] = useState<any>({
    startTime: booking.startTime,
    endTime: booking.endTime,
  });
  const [selectedDate, setSelectedDate] = useState(booking.date);
  const [customerName, setCustomerName] = useState(booking.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(booking.customerPhone || "");
  const [customerEmail, setCustomerEmail] = useState(booking.customerEmail || "");
  const [note, setNote] = useState(booking.note || "");
  const [customerLocation, setCustomerLocation] = useState(booking.customerLocation || undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositToken, setDepositToken] = useState<string | null>(null);

  const services = Array.isArray(booking.services) ? booking.services : [];
  const business = booking.business;

  const locationLink =
    business?.location?.lat && business?.location?.lng
      ? `https://www.google.com/maps?q=${business.location.lat},${business.location.lng}`
      : business?.location?.addressLine
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            business.location.addressLine
          )}`
        : null;

  const calloutCalculation = useMemo(
    () =>
      computeCalloutCharge({
        mobileSettings: business?.mobileSettings,
        customerLocation,
      }),
    [business?.mobileSettings, customerLocation]
  );

  const depositAmount = useMemo(() => {
    const serviceDeposit = services.reduce(
      (sum: number, service: any) => sum + Number(service.depositAmount || 0),
      0
    );

    if (
      business?.depositPolicy?.enabled &&
      business?.depositPolicy?.applyToCallout &&
      calloutCalculation.calloutFee > 0
    ) {
      const calloutDeposit =
        business.depositPolicy.type === "percent"
          ? Math.round(
              (calloutCalculation.calloutFee * Number(business.depositPolicy.value || 0)) / 100
            )
          : Number(business.depositPolicy.value || 0);
      return serviceDeposit + Math.max(0, Math.min(calloutDeposit, calloutCalculation.calloutFee));
    }

    return serviceDeposit;
  }, [business?.depositPolicy, calloutCalculation.calloutFee, services]);

  const depositRequired = depositAmount > 0;

  const subscriptionValid = useMemo(() => {
    if (!business?.access) return false;
    const now = new Date();
    const { status, trialEndsAt } = business.access;
    if (status === "ACTIVE" || status === "GRACE") return true;
    if (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) >= now) {
      return true;
    }
    return false;
  }, [business]);

  const canReschedule = useMemo(() => {
    const now = new Date();
    const bookingTime = new Date(`${booking.date}T${booking.startTime}`);
    return bookingTime.getTime() - now.getTime() > 6 * 60 * 60 * 1000;
  }, [booking.date, booking.startTime]);

  const confirmReschedule = async () => {
    if (!canReschedule) {
      setError("Reschedule not allowed within 6 hours of the appointment.");
      return;
    }

    if (!slot?.startTime || !slot?.endTime) {
      setError("Select a new date and slot first.");
      return;
    }

    if (booking.isMobile && calloutCalculation.pendingPreciseLocation) {
      setError("Generate the home location link first so the per KM callout fee can be recalculated.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        bookingId: booking._id,
        token,
        newDate: selectedDate,
        newStartTime: slot.startTime,
        newEndTime: slot.endTime,
        customerName,
        customerPhone,
        customerEmail,
        note,
        customerLocation,
        calloutFee: calloutCalculation.calloutFee,
        distanceKm: calloutCalculation.distanceKm,
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
      window.alert("Booking rescheduled successfully.");
    } catch (err: any) {
      console.error("Reschedule error:", err);
      setError(err.message || "Failed to reschedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <PublicBusinessHeader
        name={business?.name}
        logo={business?.logo}
        autoApprove={business?.bookingRules?.autoApprove}
        locationLink={locationLink}
        locationLabel={
          business?.location?.addressLine ||
          (business?.location?.lat && business?.location?.lng
            ? `${business.location.lat}, ${business.location.lng}`
            : undefined)
        }
        depositRequired={depositRequired}
      />

      <SlotPicker
        businessId={business?._id}
        serviceIds={services.map((service: any) => String(service._id || service.serviceId)).filter(Boolean)}
        date={selectedDate}
        onDateChange={setSelectedDate}
        onSlotSelected={setSlot}
      />

      {slot ? (
        <div className="space-y-4 border-t pt-6">
          <CustomerDetailsForm
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            note={note}
            customerLocation={customerLocation}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
            onEmailChange={setCustomerEmail}
            onNoteChange={setNote}
            services={services.map((service: any) => ({
              _id: String(service._id || service.serviceId),
              name: service.serviceName || "Service",
              selectedRefs: [],
              isMobile: booking.isMobile,
            }))}
            showMobileLocation={Boolean(booking.isMobile)}
            onLocationChange={setCustomerLocation}
            onServiceRefsChange={() => {}}
          />

          <div className="text-sm text-gray-600">
            Original: {booking.date} {booking.startTime} - {booking.endTime}
            <br />
            New: {selectedDate} {slot.startTime} - {slot.endTime}
          </div>

          {booking.isMobile && calloutCalculation.distanceKm !== null ? (
            <p className="text-sm text-gray-600">
              Recalculated callout fee: KES {calloutCalculation.calloutFee.toLocaleString()} for{" "}
              {calloutCalculation.distanceKm.toFixed(1)} km
            </p>
          ) : null}

          {booking.isMobile && calloutCalculation.pendingPreciseLocation ? (
            <p className="text-sm text-amber-700">
              Generate the home location link to recalculate the per KM callout fee.
            </p>
          ) : null}

          {error ? <p className="text-red-600">{error}</p> : null}

          <button
            disabled={!subscriptionValid || loading || !canReschedule}
            onClick={confirmReschedule}
            className="w-full rounded-xl py-2 font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {loading
              ? "Rescheduling..."
              : subscriptionValid
                ? "Confirm Reschedule"
                : "Business Offline"}
          </button>

          {depositRequired ? <p className="text-sm">Deposit required: KES {depositAmount}</p> : null}
          {calloutCalculation.calloutFee > 0 ? (
            <p className="text-sm">Call-out fee: KES {calloutCalculation.calloutFee}</p>
          ) : null}
        </div>
      ) : null}

      {showDepositModal && depositToken ? (
        <DepositModal
          bookingId={booking._id}
          token={depositToken}
          amount={depositAmount}
          serviceName={services.map((service: any) => service.serviceName || "Service").join(", ")}
          calloutFee={calloutCalculation.calloutFee}
          onSuccess={() =>
            onUpdated({
              ...booking,
              date: selectedDate,
              startTime: slot.startTime,
              endTime: slot.endTime,
              note,
              customerLocation,
              calloutFee: calloutCalculation.calloutFee,
            })
          }
          onClose={() => setShowDepositModal(false)}
        />
      ) : null}
    </div>
  );
}
