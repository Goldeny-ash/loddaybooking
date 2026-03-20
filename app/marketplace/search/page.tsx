import MarketplaceAllBusinessesClient from "@/components/marketplace/MarketplaceAllBusinessesClient";
import { getMarketplaceBusinesses } from "@/lib/marketplace";

export default async function MarketplaceSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = String(params.q || "").trim();
  const businesses = await getMarketplaceBusinesses();

  return (
    <MarketplaceAllBusinessesClient
      businesses={businesses}
      title={query ? `Results for "${query}"` : "Marketplace search"}
      subtitle="Search results"
      backHref="/marketplace"
      initialQuery={query}
    />
  );
}
