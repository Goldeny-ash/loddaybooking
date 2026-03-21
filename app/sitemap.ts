import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { getCanonicalSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerStore = await headers();
  const hostHeader =
    headerStore.get("x-forwarded-host") ||
    headerStore.get("host") ||
    "booking.lodday.com";
  const hostname = hostHeader.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
  const siteUrl = getCanonicalSiteUrl(hostname);

  if (
    hostname === "lodday.com" ||
    hostname === "www.lodday.com" ||
    hostname === "marketplace.lodday.com"
  ) {
    return [
      {
        url: "https://lodday.com",
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }

  if (hostname === "affiliates.lodday.com") {
    return [
      {
        url: "https://affiliates.lodday.com",
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];
  }

  await connectDB();

  const businesses = await Business.find({
    username: { $exists: true, $nin: [null, ""] },
    "access.status": { $in: ["TRIAL", "ACTIVE", "GRACE"] },
  })
    .select("username updatedAt")
    .lean();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl.toString(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const businessRoutes: MetadataRoute.Sitemap = businesses.map((business) => ({
    url: new URL(`/b/${business.username}`, siteUrl).toString(),
    lastModified: business.updatedAt || new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...staticRoutes, ...businessRoutes];
}
