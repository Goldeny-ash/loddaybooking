// lib/utils/time.ts

/**
 * Converts local date + time (Kenya UTC+3) into a UTC Date object
 */
export function bookingToUTC(dateStr: string, timeStr: string): Date {
  // Example:
  // dateStr = "2026-02-19"
  // timeStr = "09:15"

  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Create date in Kenya time (UTC+3)
  const kenyaDate = new Date(Date.UTC(year, month - 1, day, hours - 3, minutes));

  return kenyaDate;
}