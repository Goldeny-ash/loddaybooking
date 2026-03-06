export function getDateWindow() {
  const now = new Date();

  const format = (d: Date) =>
    d.toISOString().split("T")[0];

  const today = new Date(now);
  const tomorrow = new Date(now);
  const yesterday = new Date(now);

  tomorrow.setDate(today.getDate() + 1);
  yesterday.setDate(today.getDate() - 1);

  return {
    yesterday: format(yesterday),
    today: format(today),
    tomorrow: format(tomorrow),
  };
}


