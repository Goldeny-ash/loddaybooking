import { getSiteUrl } from "@/lib/seo";

const GOOGLE_PING_URL = "https://www.google.com/ping";

export async function pingGoogleSitemap() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const sitemapUrl = new URL("/sitemap.xml", getSiteUrl()).toString();
  const endpoint = new URL(GOOGLE_PING_URL);
  endpoint.searchParams.set("sitemap", sitemapUrl);

  try {
    await fetch(endpoint.toString(), {
      method: "GET",
      cache: "no-store",
    });
  } catch (error) {
    console.warn("Google sitemap ping failed:", error);
  }
}
