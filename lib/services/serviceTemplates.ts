export const SERVICE_TEMPLATES = {
  braids: {
    label: "Braids",
    durationMinutes: 180,
    deposit: { enabled: true, type: "fixed", value: 1000 },
    bufferMinutes: 15,
  },
  tattoo: {
    label: "Tattoo",
    durationMinutes: 240,
    deposit: { enabled: true, type: "percent", value: 30 },
    bufferMinutes: 20,
  },
  nails: {
    label: "Nails",
    durationMinutes: 60,
    deposit: { enabled: false },
    bufferMinutes: 10,
  },
  massage: {
    label: "Massage",
    durationMinutes: 90,
    deposit: { enabled: true, type: "fixed", value: 500 },
    bufferMinutes: 10,
  },
  barber: {
    label: "Barber",
    durationMinutes: 30,
    deposit: { enabled: false },
    bufferMinutes: 5,
  },
  facial: {
    label: "Facial",
    durationMinutes: 75,
    deposit: { enabled: true, type: "fixed", value: 800 },
    bufferMinutes: 10,
  },
};
