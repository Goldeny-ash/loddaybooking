import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

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
    {
      url: new URL("/affiliates", siteUrl).toString(),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
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
