"use client";

import { useMemo, useState } from "react";
import { Ban, CalendarDays, Clock3, Save } from "lucide-react";
import { getTheme } from "@/lib/theme";

type StaffBlock = {
  start: string;
  end: string;
  reason?: string;
};

type StaffOverride = {
  date: string;
  closed: boolean;
  blocks: StaffBlock[];
};

type StaffItem = {
  _id: string;
  name?: string;
  weeklyAvailability?: Record<string, { start?: string; end?: string; closed?: boolean }>;
  availabilityOverrides?: StaffOverride[];
};

type DraftInput = {
  start: string;
  duration: number;
  reason: string;
};

function dayKey(date: string) {
  return new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateSlots(start: string, end: string, step = 30) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return [];
  const out: Array<{ start: string; end: string }> = [];
  for (let cur = s; cur + step <= e; cur += step) {
    out.push({ start: toTime(cur), end: toTime(cur + step) });
  }
  return out;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

export default function StaffSlotOverridesManager({
  business,
  staffList,
}: {
  business: unknown;
  staffList: StaffItem[];
}) {
  const theme = getTheme(business);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  });

  const [savingByStaff, setSavingByStaff] = useState<Record<string, boolean>>({});
  const [draftByStaff, setDraftByStaff] = useState<Record<string, DraftInput>>({});
  const [overridesByStaff, setOverridesByStaff] = useState<Record<string, StaffOverride>>(() => {
    const init: Record<string, StaffOverride> = {};
    for (const s of staffList) {
      const current = (s.availabilityOverrides || []).find((o) => o.date === selectedDate);
      init[s._id] = current || { date: selectedDate, closed: false, blocks: [] };
    }
    return init;
  });

  const weekday = useMemo(() => dayKey(selectedDate), [selectedDate]);
  const staffById = useMemo(
    () => Object.fromEntries(staffList.map((s) => [s._id, s])),
    [staffList]
  );

  const ensureOverride = (staffId: string) => {
    const current = overridesByStaff[staffId];
    if (current?.date === selectedDate) return current;

    const fromStaff = staffById[staffId]?.availabilityOverrides?.find(
      (o) => o.date === selectedDate
    );

    return (
      fromStaff || {
        date: selectedDate,
        closed: false,
        blocks: [],
      }
    );
  };

  const setOverride = (staffId: string, next: StaffOverride) => {
    setOverridesByStaff((prev) => ({ ...prev, [staffId]: next }));
  };

  const addBlock = (staff: StaffItem) => {
    const draft = draftByStaff[staff._id] || { start: "", duration: 60, reason: "" };
    if (!draft.start || draft.duration <= 0) return;

    const base = ensureOverride(staff._id);
    const end = toTime(toMinutes(draft.start) + draft.duration);
    const nextBlocks = [...base.blocks, { start: draft.start, end, reason: draft.reason }]
      .filter((b) => toMinutes(b.end) > toMinutes(b.start))
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    setOverride(staff._id, { ...base, date: selectedDate, blocks: nextBlocks });
    setDraftByStaff((prev) => ({
      ...prev,
      [staff._id]: { ...draft, start: "", reason: "" },
    }));
  };

  const removeBlock = (staffId: string, index: number) => {
    const base = ensureOverride(staffId);
    setOverride(staffId, {
      ...base,
      date: selectedDate,
      blocks: base.blocks.filter((_, i) => i !== index),
    });
  };

  const saveStaffOverride = async (staffId: string) => {
    const payload = ensureOverride(staffId);
    setSavingByStaff((prev) => ({ ...prev, [staffId]: true }));
    try {
      const res = await fetch("/api/staff/overrides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          date: selectedDate,
          closed: payload.closed,
          blocks: payload.blocks,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to save override");
      }
    } catch (error) {
      console.error(error);
      alert("Could not save staff override. Try again.");
    } finally {
      setSavingByStaff((prev) => ({ ...prev, [staffId]: false }));
    }
  };

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl border p-4 md:p-5"
        style={{ borderColor: theme.primaryLight, background: theme.backgroundSoft }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
              Staff Slot Control
            </h3>
            <p className="text-sm" style={{ color: theme.accentDark }}>
              Disable specific time slots or mark a staff member unavailable for the day.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <CalendarDays size={16} style={{ color: theme.primary }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border px-3 py-2 bg-white"
              style={{ borderColor: theme.primaryLight }}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {staffList.map((staff) => {
          const weekly = staff.weeklyAvailability?.[weekday];
          const canWork = Boolean(weekly?.start && weekly?.end && !weekly?.closed);
          const override = ensureOverride(staff._id);
          const previewSlots =
            canWork && !override.closed ? generateSlots(weekly?.start || "", weekly?.end || "", 30) : [];

          return (
            <div
              key={staff._id}
              className="rounded-2xl border bg-white shadow-sm p-4 space-y-4"
              style={{ borderColor: theme.primaryLight }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold" style={{ color: theme.primaryDark }}>
                    {staff.name || "Staff"}
                  </p>
                  <p className="text-xs" style={{ color: theme.accentDark }}>
                    {canWork ? `${weekly?.start} - ${weekly?.end}` : "No weekly shift on this day"}
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={override.closed}
                    onChange={(e) =>
                      setOverride(staff._id, {
                        ...override,
                        date: selectedDate,
                        closed: e.target.checked,
                        blocks: e.target.checked ? [] : override.blocks,
                      })
                    }
                  />
                  Mark Day Off
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  type="time"
                  value={draftByStaff[staff._id]?.start || ""}
                  onChange={(e) =>
                    setDraftByStaff((prev) => ({
                      ...prev,
                      [staff._id]: {
                        start: e.target.value,
                        duration: prev[staff._id]?.duration || 60,
                        reason: prev[staff._id]?.reason || "",
                      },
                    }))
                  }
                  className="rounded-lg border px-2 py-2 text-sm"
                  style={{ borderColor: theme.primaryLight }}
                  disabled={override.closed || !canWork}
                />
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={draftByStaff[staff._id]?.duration || 60}
                  onChange={(e) =>
                    setDraftByStaff((prev) => ({
                      ...prev,
                      [staff._id]: {
                        start: prev[staff._id]?.start || "",
                        duration: Number(e.target.value || 0),
                        reason: prev[staff._id]?.reason || "",
                      },
                    }))
                  }
                  className="rounded-lg border px-2 py-2 text-sm"
                  style={{ borderColor: theme.primaryLight }}
                  disabled={override.closed || !canWork}
                />
                <input
                  placeholder="Reason (optional)"
                  value={draftByStaff[staff._id]?.reason || ""}
                  onChange={(e) =>
                    setDraftByStaff((prev) => ({
                      ...prev,
                      [staff._id]: {
                        start: prev[staff._id]?.start || "",
                        duration: prev[staff._id]?.duration || 60,
                        reason: e.target.value,
                      },
                    }))
                  }
                  className="rounded-lg border px-2 py-2 text-sm md:col-span-2"
                  style={{ borderColor: theme.primaryLight }}
                  disabled={override.closed || !canWork}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addBlock(staff)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white"
                  style={{ background: theme.primary }}
                  disabled={override.closed || !canWork}
                >
                  <Ban size={14} />
                  Disable Slot
                </button>
                <button
                  type="button"
                  onClick={() => saveStaffOverride(staff._id)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm border"
                  style={{ borderColor: theme.primaryLight, color: theme.primaryDark }}
                  disabled={Boolean(savingByStaff[staff._id])}
                >
                  <Save size={14} />
                  {savingByStaff[staff._id] ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accentDark }}>
                  Disabled Blocks
                </p>
                {override.blocks.length === 0 ? (
                  <p className="text-xs" style={{ color: theme.accentDark }}>
                    No disabled intervals.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {override.blocks.map((b, idx) => (
                      <div
                        key={`${b.start}-${b.end}-${idx}`}
                        className="rounded-lg border px-2 py-1.5 text-xs flex items-center justify-between"
                        style={{ borderColor: theme.primaryLight, background: theme.backgroundSoft }}
                      >
                        <span className="inline-flex items-center gap-1" style={{ color: theme.primaryDark }}>
                          <Clock3 size={12} />
                          {b.start} - {b.end}
                          {b.reason ? ` • ${b.reason}` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBlock(staff._id, idx)}
                          className="text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accentDark }}>
                  Slot Preview
                </p>
                {!canWork ? (
                  <p className="text-xs" style={{ color: theme.accentDark }}>
                    No shift configured for {weekday}.
                  </p>
                ) : override.closed ? (
                  <p className="text-xs text-red-600">Unavailable for the entire day.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {previewSlots.map((slot) => {
                      const blocked = override.blocks.some((b) =>
                        overlaps(slot.start, slot.end, b.start, b.end)
                      );
                      return (
                        <span
                          key={`${slot.start}-${slot.end}`}
                          className="px-2 py-1 rounded-full text-[11px] border"
                          style={{
                            borderColor: blocked ? "#ef4444" : theme.primaryLight,
                            color: blocked ? "#b91c1c" : theme.primaryDark,
                            background: blocked ? "#fee2e2" : "white",
                          }}
                        >
                          {slot.start}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
