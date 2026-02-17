"use client";

type Slot = {
  time: string;
  staffId: string;
};

type Props = {
  slots: Slot[];
  selectedTime: string;
  loading?: boolean;
  onSelect: (time: string) => void;
};

export default function TimeSlotPicker({
  slots,
  selectedTime,
  loading = false,
  onSelect,
}: Props) {
  /* -------------------------
     Loading state
  ------------------------- */
  if (loading) {
    return (
      <div className="bg-white rounded border p-4">
        <p className="text-sm text-gray-500">Loading available times…</p>
      </div>
    );
  }

  /* -------------------------
     No availability
  ------------------------- */
  if (!slots || slots.length === 0) {
    return (
      <div className="bg-white rounded border p-4">
        <p className="text-sm text-gray-500">
          No available time slots for this date.
        </p>
      </div>
    );
  }

  /* -------------------------
     Render slots
  ------------------------- */
  return (
    <div className="bg-white rounded border p-4">
      <h3 className="text-sm font-medium mb-3">Select a time</h3>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => {
          const isSelected = slot.time === selectedTime;

          return (
            <button
              key={`${slot.staffId}-${slot.time}`}
              type="button"
              onClick={() => onSelect(slot.time)}
              className={`
                px-3 py-2 rounded text-sm border transition
                ${
                  isSelected
                    ? "bg-primary text-white border-primary"
                    : "bg-white hover:bg-gray-50 border-gray-300"
                }
              `}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
