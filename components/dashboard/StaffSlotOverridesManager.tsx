"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, CalendarDays, Clock3, Save } from "lucide-react";
import ThemedPopup from "@/components/ThemedPopup";
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
  durationHours: number;
  durationMinutes: number;
  reason: string;
};

type PopupState = {
  message: string;
  variant?: "success" | "error";
  mode?: "toast" | "confirm";
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
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

const DEFAULT_DRAFT: DraftInput = {
  start: "",
  durationHours: 1,
  durationMinutes: 0,
  reason: "",
};

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
  const [unsavedStaffIds, setUnsavedStaffIds] = useState<string[]>([]);
  const [popup, setPopup] = useState<PopupState | null>(null);
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
  const hasUnsavedChanges = unsavedStaffIds.length > 0;
  const isSaving = unsavedStaffIds.some((staffId) => savingByStaff[staffId]);

  useEffect(() => {
    setUnsavedStaffIds([]);
  }, [selectedDate]);

  const showPopup = (next: PopupState) => {
    setPopup(next);
  };

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

  const markUnsaved = (staffId: string) => {
    setUnsavedStaffIds((prev) => (prev.includes(staffId) ? prev : [...prev, staffId]));
  };

  const notifyUnsavedChanges = () => {
    showPopup({
      message: "You have unsaved changes. Save all changes to apply them.",
      variant: "success",
    });
  };

  const setOverride = (staffId: string, next: StaffOverride) => {
    setOverridesByStaff((prev) => ({ ...prev, [staffId]: next }));
    markUnsaved(staffId);
  };

  const setDraft = (staffId: string, next: DraftInput) => {
    setDraftByStaff((prev) => ({ ...prev, [staffId]: next }));
  };

  const addBlock = (staff: StaffItem) => {
    const draft = draftByStaff[staff._id] || DEFAULT_DRAFT;
    const totalDuration = draft.durationHours * 60 + draft.durationMinutes;
    if (!draft.start || totalDuration <= 0) return;

    const base = ensureOverride(staff._id);
    const end = toTime(toMinutes(draft.start) + totalDuration);
    const nextBlocks = [...base.blocks, { start: draft.start, end, reason: draft.reason }]
      .filter((b) => toMinutes(b.end) > toMinutes(b.start))
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    setOverride(staff._id, { ...base, date: selectedDate, blocks: nextBlocks });
    setDraft(staff._id, { ...draft, start: "", reason: "" });
    notifyUnsavedChanges();
  };

  const removeBlock = (staffId: string, index: number) => {
    const base = ensureOverride(staffId);
    setOverride(staffId, {
      ...base,
      date: selectedDate,
      blocks: base.blocks.filter((_, i) => i !== index),
    });
    notifyUnsavedChanges();
  };

  const saveAllOverrides = async () => {
    if (!unsavedStaffIds.length) {
      showPopup({
        message: "There are no unsaved changes.",
        variant: "error",
      });
      return;
    }

    const idsToSave = [...unsavedStaffIds];

    setSavingByStaff((prev) => {
      const next = { ...prev };
      for (const staffId of idsToSave) next[staffId] = true;
      return next;
    });

    try {
      await Promise.all(
        idsToSave.map(async (staffId) => {
          const payload = ensureOverride(staffId);
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
        })
      );

      setUnsavedStaffIds([]);
      showPopup({
        message: "All staff slot changes have been saved.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      showPopup({
        message: "Could not save staff overrides. Try again.",
        variant: "error",
      });
    } finally {
      setSavingByStaff((prev) => {
        const next = { ...prev };
        for (const staffId of idsToSave) next[staffId] = false;
        return next;
      });
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

          <div className="flex flex-col gap-3 md:items-end">
            <label className="flex items-center gap-2 text-sm">
              <CalendarDays size={16} style={{ color: theme.primary }} />
              <span className="font-medium" style={{ color: theme.primaryDark }}>
                Date to manage
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border px-3 py-2 bg-white"
                style={{ borderColor: theme.primaryLight }}
              />
            </label>

            <button
              type="button"
              onClick={() =>
                showPopup({
                  mode: "confirm",
                  title: "Save All Changes",
                  message: "Are you sure you want to save all staff slot changes?",
                  confirmText: "Save All",
                  cancelText: "Cancel",
                  onConfirm: async () => {
                    setPopup(null);
                    await saveAllOverrides();
                  },
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              style={{ background: theme.primary }}
              disabled={!hasUnsavedChanges || isSaving}
            >
              <Save size={16} />
              {isSaving
                ? "Saving Changes..."
                : hasUnsavedChanges
                  ? `Save All Changes (${unsavedStaffIds.length})`
                  : "No Unsaved Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {staffList.map((staff) => {
          const weekly = staff.weeklyAvailability?.[weekday];
          const canWork = Boolean(weekly?.start && weekly?.end && !weekly?.closed);
          const override = ensureOverride(staff._id);
          const previewSlots =
            canWork && !override.closed
              ? generateSlots(weekly?.start || "", weekly?.end || "", 30)
              : [];
          const draft = draftByStaff[staff._id] || DEFAULT_DRAFT;

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
                    onChange={(e) => {
                      setOverride(staff._id, {
                        ...override,
                        date: selectedDate,
                        closed: e.target.checked,
                        blocks: e.target.checked ? [] : override.blocks,
                      });
                      notifyUnsavedChanges();
                    }}
                  />
                  Mark Day Off
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block font-medium" style={{ color: theme.primaryDark }}>
                    Time to start disabling the slot
                  </span>
                  <input
                    type="time"
                    value={draft.start}
                    onChange={(e) =>
                      setDraft(staff._id, {
                        ...draft,
                        start: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-2 py-2 text-sm"
                    style={{ borderColor: theme.primaryLight }}
                    disabled={override.closed || !canWork}
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium" style={{ color: theme.primaryDark }}>
                    Duration hours
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.durationHours}
                    onChange={(e) =>
                      setDraft(staff._id, {
                        ...draft,
                        durationHours: Number(e.target.value || 0),
                      })
                    }
                    className="w-full rounded-lg border px-2 py-2 text-sm"
                    style={{ borderColor: theme.primaryLight }}
                    disabled={override.closed || !canWork}
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium" style={{ color: theme.primaryDark }}>
                    Duration minutes staff will be away
                  </span>
                  <select
                    value={draft.durationMinutes}
                    onChange={(e) =>
                      setDraft(staff._id, {
                        ...draft,
                        durationMinutes: Number(e.target.value || 0),
                      })
                    }
                    className="w-full rounded-lg border px-2 py-2 text-sm"
                    style={{ borderColor: theme.primaryLight }}
                    disabled={override.closed || !canWork}
                  >
                    {[0, 15, 30, 45].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minutes
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium" style={{ color: theme.primaryDark }}>
                    Reason
                  </span>
                  <input
                    placeholder="Optional reason"
                    value={draft.reason}
                    onChange={(e) =>
                      setDraft(staff._id, {
                        ...draft,
                        reason: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-2 py-2 text-sm"
                    style={{ borderColor: theme.primaryLight }}
                    disabled={override.closed || !canWork}
                  />
                </label>
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

                <span className="text-xs font-medium" style={{ color: theme.accentDark }}>
                  {unsavedStaffIds.includes(staff._id) ? "Unsaved changes" : "All changes saved"}
                </span>
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

      <ThemedPopup
        message={popup?.message ?? null}
        onClose={() => setPopup(null)}
        variant={popup?.variant || "success"}
        mode={popup?.mode || "toast"}
        title={popup?.title}
        confirmText={popup?.confirmText}
        cancelText={popup?.cancelText}
        onConfirm={popup?.onConfirm}
      />
    </div>
  );
}
