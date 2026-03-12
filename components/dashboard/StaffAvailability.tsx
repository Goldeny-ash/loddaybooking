"use client";
import { useState } from "react";

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface Slot {
  start: string;
  end: string;
  closed: boolean;
}

interface Props {
  staffId: string;
  availability: Record<string, Record<string, Slot>>;
  setAvailability: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, Slot>>>
  >;
}

const EMPTY_SLOT: Slot = {
  start: "",
  end: "",
  closed: false,
};

export default function StaffAvailability({
  staffId,
  availability,
  setAvailability,
}: Props) {
  const monday = DAYS[0];

  const toggleClosed = (day: string) => {
    setAvailability((prev) => {
      const staff = prev[staffId] ?? {};
      const current = staff[day] ?? EMPTY_SLOT;

      return {
        ...prev,
        [staffId]: {
          ...staff,
          [day]: {
            ...current,
            closed: !current.closed,
            start: !current.closed ? "" : current.start,
            end: !current.closed ? "" : current.end,
          },
        },
      };
    });
  };

  const updateTime = (day: string, field: "start" | "end", value: string) => {
    setAvailability((prev) => {
      const staff = prev[staffId] ?? {};
      const current = staff[day] ?? EMPTY_SLOT;

      return {
        ...prev,
        [staffId]: {
          ...staff,
          [day]: {
            ...current,
            [field]: value,
          },
        },
      };
    });
  };

  const copyToAll = (day: string) => {
    setAvailability((prev) => {
      const staff = prev[staffId] ?? {};
      const template = staff[day] ?? EMPTY_SLOT;

      const copied: Record<string, Slot> = {};
      DAYS.forEach((d) => {
        copied[d] = { ...template };
      });

      return {
        ...prev,
        [staffId]: {
          ...staff,
          ...copied,
        },
      };
    });
  };

  return (
    <div className="space-y-1">
      <p className="font-semibold text-sm text-[var(--brand-accent-dark)]">
        Availability
      </p>

      {DAYS.map((day) => {
        const slot = availability[staffId]?.[day] ?? EMPTY_SLOT;

        return (
          <div key={day} className="flex items-center gap-2">
            <span className="capitalize w-20 text-sm">{day}</span>

            <input
              type="time"
              value={slot.start}
              disabled={slot.closed}
              onChange={(e) => updateTime(day, "start", e.target.value)}
              className="border p-1 w-20 rounded text-sm"
            />

            <span>-</span>

            <input
              type="time"
              value={slot.end}
              disabled={slot.closed}
              onChange={(e) => updateTime(day, "end", e.target.value)}
              className="border p-1 w-20 rounded text-sm"
            />

            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={slot.closed}
                onChange={() => toggleClosed(day)}
              />
              Closed
            </label>

            {day === monday ? (
              <button
                type="button"
                onClick={() => copyToAll(day)}
                className="px-2 py-1 bg-gray-200 rounded text-xs"
              >
                Copy Monday to all days (populates the rest)
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
