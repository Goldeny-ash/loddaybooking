import Business from "@/lib/models/Business";
import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";
import { connectDB } from "@/lib/mongoDB";
import { getBusinessLogoUrl } from "@/lib/seo";

export interface MarketplaceBusiness {
  id: string;
  name: string;
  username: string;
  description: string;
  location: string;
  area?: string;
  county?: string;
  subCounty?: string;
  ward?: string;
  phone: string;
  logo?: string;
  bookingUrl: string;
  website?: string;
  services: string[];
  serviceCount: number;
  bookingCount: number;
  categories: string[];
  tags: string[];
  featured: boolean;
  priceFrom?: number | null;
  availableToday?: boolean;
  availableTomorrow?: boolean;
  createdAt?: string;
  isDemo?: boolean;
}

export const MARKETPLACE_URL = "https://lodday.com";
export const MARKETPLACE_ALIAS_URL = "https://lodday.com";
export const BOOKING_ROOT_URL = "https://booking.lodday.com";
export const MARKETPLACE_TITLE = "Lodday | Find and Book Local Service Businesses";
export const MARKETPLACE_DESCRIPTION =
  "Browse salons, barbershops, nail studios, makeup artists, spas, and other service businesses on Lodday. Discover businesses, compare services, and book directly online.";

function trimText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => trimText(value))
        .filter(Boolean)
    )
  );
}

function getLocationLabel(
  location?:
    | {
        county?: string | null;
        subCounty?: string | null;
        ward?: string | null;
        area?: string | null;
        locationDescription?: string | null;
      }
    | null
) {
  if (!location) return "";

  const savedArea = trimText(location.area);

  return (
    unique([savedArea, location.ward]).join(", ") ||
    savedArea ||
    trimText(location.ward) ||
    ""
  );
}

function toAbsoluteWebsiteUrl(value?: string | null) {
  const website = trimText(value);
  if (!website) return "";
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
}

function fallbackDescriptionFromPrice(price?: number | null) {
  if (typeof price === "number" && Number.isFinite(price)) {
    return `Services start from KES ${price.toLocaleString()}.`;
  }

  return "Services start on the booking page.";
}

export async function getMarketplaceBusinesses(): Promise<MarketplaceBusiness[]> {
  await connectDB();

  const businessDocs = await Business.find({
    username: { $exists: true, $ne: "" },
    name: { $exists: true, $ne: "" },
    marketplaceVisible: true,
    marketplaceStatus: "approved",
    $or: [
      { "access.status": "ACTIVE" },
      { "adminBenefits.demoBusiness": true },
    ],
  })
    .select(
      "name username description logo phone location website socialLinks tags access updatedAt createdAt adminBenefits"
    )
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  if (businessDocs.length === 0) {
    return [];
  }

  const businessIds = businessDocs.map((business) => business._id);
  const serviceDocs = await Service.find({
    businessId: { $in: businessIds },
  })
    .select("businessId name category featured basePrice")
    .lean();

  const servicesByBusinessId = new Map<
    string,
    Array<{ name?: string; category?: string; featured?: boolean; basePrice?: number | null }>
  >();

  for (const service of serviceDocs) {
    const businessId = service.businessId?.toString?.();
    if (!businessId) continue;

    const existing = servicesByBusinessId.get(businessId) || [];
    existing.push({
      name: service.name,
      category: service.category,
      featured: Boolean(service.featured),
      basePrice: typeof service.basePrice === "number" ? service.basePrice : null,
    });
    servicesByBusinessId.set(businessId, existing);
  }

  const bookingCounts = await Booking.aggregate([
    {
      $match: {
        businessId: { $in: businessIds },
      },
    },
    {
      $group: {
        _id: "$businessId",
        totalBookings: { $sum: 1 },
      },
    },
  ]);

  const bookingCountByBusinessId = new Map<string, number>();
  for (const item of bookingCounts) {
    const businessId = item._id?.toString?.();
    if (!businessId) continue;
    bookingCountByBusinessId.set(businessId, Number(item.totalBookings) || 0);
  }

  return businessDocs.map((businessDoc) => {
    const id = businessDoc._id.toString();
    const services = servicesByBusinessId.get(id) || [];
    const allServiceNames = unique(services.map((service) => service.name));
    const serviceNames = allServiceNames.slice(0, 4);
    const categories = unique(services.map((service) => service.category));
    const servicePrices = services
      .map((service) => service.basePrice)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const locationLabel = getLocationLabel(businessDoc.location);
    const bookingUrl = `${BOOKING_ROOT_URL}/b/${encodeURIComponent(trimText(businessDoc.username) || "")}?source=marketplace`;
    const tags = unique([...(businessDoc.tags || []), ...categories]).slice(0, 6);
    const featured =
      services.some((service) => service.featured) ||
      Boolean(trimText(businessDoc.logo)) ||
      tags.length >= 3;

    return {
      id,
      name: trimText(businessDoc.name) || "Lodday Business",
      username: trimText(businessDoc.username),
      description:
        trimText(businessDoc.description) ||
        fallbackDescriptionFromPrice(servicePrices.length > 0 ? Math.min(...servicePrices) : null),
      location: locationLabel,
      area: trimText(businessDoc.location?.area),
      county: trimText(businessDoc.location?.county),
      subCounty: trimText(businessDoc.location?.subCounty),
      ward: trimText(businessDoc.location?.ward),
      phone: trimText(businessDoc.phone),
      logo: getBusinessLogoUrl(businessDoc.logo),
      bookingUrl,
      website: toAbsoluteWebsiteUrl(businessDoc.website),
      services: serviceNames,
      serviceCount: allServiceNames.length,
      bookingCount: bookingCountByBusinessId.get(id) || 0,
      categories,
      tags,
      featured,
      priceFrom: servicePrices.length > 0 ? Math.min(...servicePrices) : null,
      createdAt: businessDoc.createdAt ? new Date(businessDoc.createdAt).toISOString() : undefined,
      isDemo: Boolean(businessDoc.adminBenefits?.demoBusiness),
    };
  });
}

export function buildMarketplaceStructuredData(businesses: MarketplaceBusiness[]) {
  const topBusinesses = businesses.slice(0, 24);
  const faqEntities = [
    {
      "@type": "Question",
      name: "What is the Lodday Marketplace?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Lodday Marketplace is a discovery page where customers can browse businesses using Lodday and click through to each business booking page on booking.lodday.com.",
      },
    },
    {
      "@type": "Question",
      name: "How do customers book a business from the marketplace?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Customers browse the directory, open a business card, and are directed to that business booking page where they can view services and confirm an appointment online.",
      },
    },
    {
      "@type": "Question",
      name: "Which businesses appear on Lodday Marketplace?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The marketplace highlights active Lodday businesses with public booking pages, making it easier for people to discover local services and book online.",
      },
    },
  ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: MARKETPLACE_TITLE,
      description: MARKETPLACE_DESCRIPTION,
      url: MARKETPLACE_URL,
      isPartOf: {
        "@type": "WebSite",
        name: "Lodday",
        url: MARKETPLACE_URL,
      },
      about: [
        "Online booking marketplace",
        "Salon appointments",
        "Beauty and wellness businesses",
        "Service business directory",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: MARKETPLACE_URL,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Lodday businesses",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: topBusinesses.length,
      itemListElement: topBusinesses.map((business, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: business.bookingUrl,
        name: business.name,
        description: business.description,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntities,
    },
  ];
}
