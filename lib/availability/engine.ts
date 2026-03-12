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

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  let cursor = startMin;

  while (cursor + duration <= endMin) {
    slots.push({
      startTime: fromMinutes(cursor),
      endTime: fromMinutes(cursor + duration),
    });

    cursor += step;
  }

  return slots;
}
