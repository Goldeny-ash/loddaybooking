import MarketplaceDirectoryClient from "@/components/marketplace/MarketplaceDirectoryClient";
import Footer from "@/components/Footer";
import {
  buildMarketplaceStructuredData,
  getMarketplaceBusinesses,
} from "@/lib/marketplace";

export default async function MarketplaceExperience() {
  const businesses = await getMarketplaceBusinesses();
  const categoryCount = new Set(
    businesses.flatMap((business) => business.categories.map((category) => category.toLowerCase()))
  ).size;
  const structuredData = buildMarketplaceStructuredData(businesses);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-[#fff8ef] text-[#001524]">
        <MarketplaceDirectoryClient
          businesses={businesses}
          totalBusinesses={businesses.length}
          totalCategories={categoryCount}
        />
        <Footer />
      </main>
    </>
  );
}
