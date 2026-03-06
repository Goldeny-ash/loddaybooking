import type { Metadata } from "next";

export interface SeoServiceLike {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  basePrice?: number | null;
}

export interface SeoBusinessLike {
  name?: string | null;
  username?: string | null;
  description?: string | null;
  logo?: string | string[] | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  openingHours?: Record<string, { open?: string; close?: string; closed?: boolean }> | null;
  location?:
    | {
        county?: string | null;
        subCounty?: string | null;
        ward?: string | null;
        addressLine?: string | null;
        locationDescription?: string | null;
        lat?: number | null;
        lng?: number | null;
      }
    | null;
  locationLabel?: string | null;
}

const DEFAULT_SITE_URL = "https://booking.lodday.com";

function trimText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function dedupe(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => trimText(value))
        .filter(Boolean)
    )
  );
}

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    DEFAULT_SITE_URL;

  try {
    return new URL(raw);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function getBusinessUrl(username: string) {
  return new URL(`/b/${encodeURIComponent(username)}`, getSiteUrl()).toString();
}

export function getBusinessLogoUrl(logo?: string | string[] | null) {
  const logoUrl =
    typeof logo === "string" ? logo : Array.isArray(logo) && logo.length > 0 ? logo[0] : "";

  if (!logoUrl) return undefined;

  try {
    return new URL(logoUrl, getSiteUrl()).toString();
  } catch {
    return undefined;
  }
}

export function formatList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

export function getBusinessLocationLabel(business: SeoBusinessLike) {
  const location = business.location || {};

  return (
    trimText(business.locationLabel) ||
    trimText(location.addressLine) ||
    dedupe([location.ward, location.subCounty, location.county]).join(", ") ||
    trimText(location.locationDescription) ||
    ""
  );
}

export function getServiceNames(services: SeoServiceLike[], limit = 8) {
  return dedupe(services.map((service) => service.name)).slice(0, limit);
}

export function getServiceCategories(services: SeoServiceLike[], limit = 4) {
  return dedupe(services.map((service) => service.category)).slice(0, limit);
}

export function buildBusinessSeoCopy(
  business: SeoBusinessLike,
  services: SeoServiceLike[]
) {
  const businessName = trimText(business.name) || "this business";
  const location = getBusinessLocationLabel(business);
  const serviceNames = getServiceNames(services);
  const categories = getServiceCategories(services);
  const serviceText =
    serviceNames.length > 0
      ? formatList(serviceNames)
      : categories.length > 0
        ? `${formatList(categories)} services`
        : "services";

  const shortLocation = location ? ` in ${location}` : "";
  const description = trimText(business.description);
  const summarySentence = `Book ${serviceText} online with ${businessName}${shortLocation}.`;
  const searchDescription = description
    ? `${summarySentence} ${description}`.slice(0, 180)
    : `${summarySentence} View availability, pricing, and appointment details on Lodday Booking.`;
  const keywordPool = dedupe([
    businessName,
    ...serviceNames,
    ...categories.map((category) => `${category} booking`),
    location ? `${businessName} ${location}` : "",
    serviceNames[0] ? `${serviceNames[0]} booking` : "",
    categories[0] ? `${categories[0]} appointment` : "",
  ]);
  const searchIntentPhrases = dedupe([
    serviceNames[0] ? `${serviceNames[0]} near me` : "",
    serviceNames[0] ? `${serviceNames[0]} booking` : "",
    categories[0] ? `${categories[0]} near me` : "",
    categories[0] ? `${categories[0]} appointment` : "",
    `${businessName} online booking`,
  ]);

  return {
    businessName,
    location,
    serviceNames,
    categories,
    summarySentence,
    searchDescription,
    keywords: keywordPool,
    searchIntentPhrases,
  };
}

export function buildBusinessMetadata(
  business: SeoBusinessLike,
  services: SeoServiceLike[]
): Metadata {
  const seo = buildBusinessSeoCopy(business, services);
  const canonical = getBusinessUrl(trimText(business.username) || "");
  const image = getBusinessLogoUrl(business.logo);
  const title = `${seo.businessName} | Book Online on Lodday`;

  return {
    title,
    description: seo.searchDescription,
    keywords: seo.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: seo.searchDescription,
      url: canonical,
      siteName: "Lodday Booking",
      type: "website",
      images: image ? [{ url: image, alt: seo.businessName }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: seo.searchDescription,
      images: image ? [image] : undefined,
    },
  };
}

function mapLocalBusinessType(categories: string[]) {
  const normalized = categories.map((category) => category.toLowerCase());

  if (normalized.includes("nails")) return "NailSalon";
  if (normalized.includes("hair")) return "HairSalon";
  if (
    normalized.includes("beauty treatments") ||
    normalized.includes("permanent makeup") ||
    normalized.includes("body enhancements")
  ) {
    return "BeautySalon";
  }

  return "LocalBusiness";
}

const DAY_MAP: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function toOpeningHours(
  openingHours?: Record<string, { open?: string; close?: string; closed?: boolean }> | null
) {
  if (!openingHours) return undefined;

  const values = Object.entries(openingHours)
    .map(([day, hours]) => {
      if (!hours || hours.closed || !hours.open || !hours.close) return null;
      const mappedDay = DAY_MAP[day.toLowerCase()];
      if (!mappedDay) return null;
      return `${mappedDay} ${hours.open}-${hours.close}`;
    })
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

export function buildBusinessStructuredData(
  business: SeoBusinessLike,
  services: SeoServiceLike[]
) {
  const seo = buildBusinessSeoCopy(business, services);
  const url = getBusinessUrl(trimText(business.username) || "");
  const logo = getBusinessLogoUrl(business.logo);
  const location = business.location || {};
  const sameAs = dedupe([business.website]);

  return {
    "@context": "https://schema.org",
    "@type": mapLocalBusinessType(seo.categories),
    name: seo.businessName,
    description: seo.searchDescription,
    url,
    image: logo,
    telephone: trimText(business.phone) || undefined,
    email: trimText(business.email) || undefined,
    address: seo.location
      ? {
          "@type": "PostalAddress",
          streetAddress: trimText(location.addressLine) || undefined,
          addressLocality: trimText(location.subCounty) || undefined,
          addressRegion: trimText(location.county) || undefined,
          addressCountry: "KE",
        }
      : undefined,
    geo:
      typeof location.lat === "number" && typeof location.lng === "number"
        ? {
            "@type": "GeoCoordinates",
            latitude: location.lat,
            longitude: location.lng,
          }
        : undefined,
    openingHours: toOpeningHours(business.openingHours),
    hasOfferCatalog:
      services.length > 0
        ? {
            "@type": "OfferCatalog",
            name: `${seo.businessName} services`,
            itemListElement: services.slice(0, 12).map((service) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: trimText(service.name) || "Service",
                description: trimText(service.description) || undefined,
                category: trimText(service.category) || undefined,
              },
              price:
                typeof service.basePrice === "number" ? service.basePrice.toString() : undefined,
              priceCurrency: "KES",
            })),
          }
        : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}
