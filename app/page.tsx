import type { Metadata } from "next";
import MarketplaceExperience from "@/components/marketplace/MarketplaceExperience";
import {
  MARKETPLACE_DESCRIPTION,
  MARKETPLACE_TITLE,
  MARKETPLACE_URL,
} from "@/lib/marketplace";

export const metadata: Metadata = {
  title: MARKETPLACE_TITLE,
  description: MARKETPLACE_DESCRIPTION,
  alternates: {
    canonical: MARKETPLACE_URL,
  },
  keywords: [
    "Lodday marketplace",
    "book service businesses online",
    "salon marketplace Kenya",
    "beauty businesses near me",
    "appointment booking marketplace",
    "Lodday businesses",
    "book salons online",
    "find barbershop appointments",
  ],
  openGraph: {
    title: MARKETPLACE_TITLE,
    description: MARKETPLACE_DESCRIPTION,
    url: MARKETPLACE_URL,
    siteName: "Lodday",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: MARKETPLACE_TITLE,
    description: MARKETPLACE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function HomePage() {
  return <MarketplaceExperience />;
}
