import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCanonicalSiteUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerStore = await headers();
  const hostHeader =
    headerStore.get("x-forwarded-host") ||
    headerStore.get("host") ||
    "booking.lodday.com";
  const hostname = hostHeader.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
  const siteUrl = getCanonicalSiteUrl(hostname);
  const root = siteUrl.toString().replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/blg",
          "/dashboard",
          "/login",
          "/setup",
          "/subscription",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${root}/sitemap.xml`,
    host: siteUrl.host,
  };
}
