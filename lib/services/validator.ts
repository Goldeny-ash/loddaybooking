export function validateService(input: any) {
  if (!input.name) return "Service name is required";

  if (input.durationMinutes < 5)
    return "Duration must be at least 5 minutes";

  if (input.price < 0)
    return "Price cannot be negative";

  if (!input.staffScope)
    return "Assign staff or group";

  return null;
}
