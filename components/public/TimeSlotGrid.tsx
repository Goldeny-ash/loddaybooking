"use client";

interface Slot {
  startTime: string;
  endTime: string;
}

interface Props {
  slots: Slot[];
  selectedSlot?: Slot;
  onSelect: (slot: Slot) => void;
  loading?: boolean;
}

export default function TimeSlotGrid({
  slots,
  selectedSlot,
  onSelect,
  loading = false,
}: Props) {
  const skeletonSlots = Array.from({ length: 6 }, (_, index) => index);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {skeletonSlots.map((index) => (
          <div key={index} className="h-12 animate-pulse rounded-md bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return <p className="text-sm text-gray-500">No available slots for this date</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {slots.map((slot) => {
        const selected =
          selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;

        return (
          <button
            key={`${slot.startTime}-${slot.endTime}`}
            type="button"
            onClick={() => onSelect(slot)}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              selected ? "bg-black text-white" : "hover:bg-gray-100"
            }`}
          >
            <div className="font-medium">
              {slot.startTime} - {slot.endTime}
            </div>
          </button>
        );
      })}
    </div>
  );
}
