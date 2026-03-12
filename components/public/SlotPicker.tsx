"use client";

import { useCallback, useEffect, useState } from "react";
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
  refreshKey?: number;
  onDateChange: (date: string) => void;
  onSlotSelected: (slot: Slot) => void;
  onSlotUnavailable?: () => void;
  setLoading?: (loading: boolean) => void;
}

export default function SlotPicker({
  businessId,
  serviceIds,
  date,
  refreshKey = 0,
  onDateChange,
  onSlotSelected,
  onSlotUnavailable,
  setLoading: setParentLoading,
}: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const serviceIdsKey = serviceIds.join(",");

  const loadAvailability = useCallback(async () => {
    if (!date || !businessId || !serviceIds.length) {
      setSlots([]);
      setSelectedSlot(null);
      return [];
    }

    setLoading(true);
    setParentLoading?.(true);
    setSelectedSlot(null);

    try {
      const params = new URLSearchParams();
      params.set("businessId", businessId);
      params.set("date", date);
      params.set("services", serviceIdsKey);

      const res = await fetch(`/api/availability?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(await res.text());
        setSlots([]);
        return [];
      }

      const data = await res.json();
      const nextSlots = Array.isArray(data.slots)
        ? data.slots.map((slot: Slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
          }))
        : [];

      setSlots(nextSlots);
      return nextSlots;
    } catch (err) {
      console.error("Availability error", err);
      setSlots([]);
      return [];
    } finally {
      setLoading(false);
      setParentLoading?.(false);
    }
  }, [businessId, date, serviceIds.length, serviceIdsKey, setParentLoading]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability, refreshKey]);

  const handleSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    onSlotSelected(slot);
  };

  const skeletonSlots = Array.from({ length: 6 }, (_, index) => index);

  return (
    <div className="flex flex-col gap-6">
      <DatePicker date={date} onChange={onDateChange} />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {skeletonSlots.map((index) => (
            <div key={index} className="h-12 animate-pulse rounded-md bg-gray-200" />
          ))}
        </div>
      ) : null}

      {!loading && date ? (
        <TimeSlotGrid
          slots={slots}
          selectedSlot={selectedSlot ?? undefined}
          onSelect={(slot) => {
            handleSelect(slot);
          }}
        />
      ) : null}

      {!loading && date && slots.length === 0 ? (
        <p className="text-sm text-gray-500">No available slots for this date. Try another day.</p>
      ) : null}
    </div>
  );
}
