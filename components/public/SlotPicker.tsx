"use client";

import { useEffect, useState } from "react";
import DatePicker from "@/components/public/DatePicker";
import TimeSlotGrid from "./TimeSlotGrid";

export interface Slot {
  startTime: string;
  endTime: string;
}

interface Props {
  businessId: string;
  serviceIds: string[];
  date: string;
  onDateChange: (date: string) => void;
  onSlotSelected: (slot: Slot) => void;
  setLoading?: (loading: boolean) => void;
}

export default function SlotPicker({
  businessId,
  serviceIds,
  date,
  onDateChange,
  onSlotSelected,
  setLoading: setParentLoading,
}: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (!date || !businessId || !serviceIds.length) return;

  async function loadAvailability() {
    setLoading(true);
    setParentLoading?.(true);
    setSelectedSlot(null);

    try {
      const params = new URLSearchParams();
      params.set("businessId", businessId);
      params.set("date", date);
      params.set("services", serviceIds.join(","));

      const res = await fetch(`/api/availability?${params.toString()}`);
      if (!res.ok) {
        console.error(await res.text());
        setSlots([]);
        return;
      }

      const data = await res.json();
      setSlots(
        Array.isArray(data.slots)
          ? data.slots.map((s: any) => ({
              startTime: s.startTime,
              endTime: s.endTime,
            }))
          : []
      );
    } catch (err) {
      console.error("Availability error", err);
      setSlots([]);
    } finally {
      setLoading(false);
      setParentLoading?.(false);
    }
  }

  loadAvailability();
  // --- use JSON.stringify for stable dependency ---
}, [date, businessId, JSON.stringify(serviceIds), setParentLoading]);


  const handleSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    onSlotSelected(slot);
  };

  const skeletonSlots = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="flex flex-col gap-6">
      <DatePicker date={date} onChange={onDateChange} />

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {skeletonSlots.map(i => (
            <div key={i} className="h-12 rounded-md bg-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && date && (
        <TimeSlotGrid
          slots={slots}
          selectedSlot={selectedSlot ?? undefined}
          onSelect={handleSelect}
        />
      )}

      {!loading && date && slots.length === 0 && (
        <p className="text-sm text-gray-500">
          No available slots for this date. Try another day.
        </p>
      )}
    </div>
  );
}
