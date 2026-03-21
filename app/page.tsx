import type { Metadata } from "next";
import { headers } from "next/headers";
import HomeLanding from "@/components/home/HomeLanding";
import MarketplaceExperience from "@/components/marketplace/MarketplaceExperience";
import AffiliatesHomePage from "@/components/affiliates/AffiliatesHomePage";

export const metadata: Metadata = {
  title: "Lodday | Online Booking for Service Businesses",
  description:
    "Lodday helps service businesses manage bookings, collect deposits, and publish branded online booking pages.",
};

function normalizeHost(value: string) {
  return value
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();
}

export default async function HomePage() {
  const headerStore = await headers();
  const hostHeader =
    headerStore.get("x-forwarded-host") || headerStore.get("host") || "booking.lodday.com";
  const hostname = normalizeHost(hostHeader);

  if (
    hostname === "lodday.com" ||
    hostname === "www.lodday.com" ||
    hostname === "marketplace.lodday.com"
  ) {
    return <MarketplaceExperience />;
  }

  if (hostname === "affiliates.lodday.com") {
    return <AffiliatesHomePage />;
  }

  return <HomeLanding />;
}
