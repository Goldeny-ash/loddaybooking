import type { Metadata } from "next";
import Footer from "@/components/Footer";
import MarketplaceAllBusinessesClient from "@/components/marketplace/MarketplaceAllBusinessesClient";
import { getMarketplaceBusinesses } from "@/lib/marketplace";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugifyCategory(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = `${titleFromSlug(slug)} Businesses`;

  return {
    title,
    description: `Browse ${title.toLowerCase()} on Lodday and book directly online.`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function MarketplaceCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const allBusinesses = await getMarketplaceBusinesses();
  const categoryBusinesses = allBusinesses.filter((business) =>
    business.categories.some((category) => slugifyCategory(category) === slug)
  );

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#101828]">
      <MarketplaceAllBusinessesClient
        businesses={categoryBusinesses}
        title={`${titleFromSlug(slug)} Businesses`}
        
        backHref="/"
      />
      <Footer />
    </main>
  );
}
