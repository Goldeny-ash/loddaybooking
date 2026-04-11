export function getSubdomain(host: string) {
  return host.split(".")[0]?.toLowerCase().trim() || "";
}

export function normalizeHost(value: string) {
  return value
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();
}

export function usernameToSubdomain(username: string) {
  return String(username || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-/g, "");
}

export function isLoddaySubdomainHost(hostname: string) {
  return hostname.endsWith(".lodday.com");
}
