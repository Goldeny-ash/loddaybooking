import { headers } from "next/headers";

function normalizeHost(value: string) {
  return value
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();
}

export async function getBlogBasePath() {
  const headerStore = await headers();
  const hostHeader = headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
  const hostname = normalizeHost(hostHeader);
  return hostname === "blog.lodday.com" ? "" : "/blg";
}

export function blogHref(basePath: string, path = "") {
  const normalizedBase = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${normalizedBase}${normalizedPath}` || "/";
}
