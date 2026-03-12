export function formatDuration(durationMinutes?: number | null) {
  const totalMinutes = Math.max(0, Math.round(durationMinutes ?? 0));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} hr`;
  }

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return "";
}
