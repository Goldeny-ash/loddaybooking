import type { Metadata } from "next";
import Footer from "@/components/Footer";
import MarketplaceAllBusinessesClient from "@/components/marketplace/MarketplaceAllBusinessesClient";
import { getMarketplaceBusinesses } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: "Filtered Lodday Businesses",
  description:
    "Browse Lodday businesses filtered by county, area, category, price, and availability.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function MarketplaceFiltersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    county?: string;
    area?: string;
    category?: string;
    price?: "any" | "under-1000" | "1000-3000" | "3000-plus";
    availability?: "any" | "today" | "tomorrow";
    sort?: "recommended" | "top-rated" | "price-low-high";
  }>;
}) {
  const businesses = await getMarketplaceBusinesses();
  const params = (await searchParams) || {};

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#101828]">
      <MarketplaceAllBusinessesClient
        businesses={businesses}
        title="Filtered businesses"
        subtitle="Marketplace filters"
        backHref="/"
        initialQuery={params.q || ""}
        initialCounty={params.county || "All Counties"}
        initialArea={params.area || "All Areas"}
        initialCategory={params.category || "All"}
        initialPriceTier={params.price || "any"}
        initialAvailability={params.availability || "any"}
        initialSortMode={params.sort || "recommended"}
      />
      <Footer />
    </main>
  );
}
