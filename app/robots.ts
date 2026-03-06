import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/dashboard", "/setup", "/subscription", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: `${siteUrl.toString().replace(/\/$/, "")}/sitemap.xml`,
    host: siteUrl.host,
  };
}
