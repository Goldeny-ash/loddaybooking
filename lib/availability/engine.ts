import { toMinutes, fromMinutes } from "./time";

export interface SlotWindow {
  startTime: string;
  endTime: string;
}

export function generateSlots(
  start: string,
  end: string,
  duration: number,
  step = 15
): SlotWindow[] {
  const slots: SlotWindow[] = [];

  let cursor = toMinutes(start);
  const limit = toMinutes(end);

  while (cursor + duration <= limit) {
    slots.push({
      startTime: fromMinutes(cursor),
      endTime: fromMinutes(cursor + duration),
    });

    cursor += step;
  }

  return slots;
}
