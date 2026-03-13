import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicBookingPageClient from "@/components/public/PublicBookingPageClient";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import ReferenceImage from "@/lib/models/ReferenceImage";
import Service from "@/lib/models/Service";
import {
  buildBusinessMetadata,
  buildBusinessSeoCopy,
  buildBusinessStructuredData,
} from "@/lib/seo";
import { getTheme } from "@/lib/theme";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

async function getPageData(username: string) {
  await connectDB();

  const businessDoc = await Business.findOne({ username });
  if (!businessDoc) {
    return null;
  }

  const businessRaw = businessDoc.toObject({ flattenMaps: true });
  const openingHours: Record<
    string,
    { open: string; close: string; closed?: boolean }
  > =
    businessRaw.openingHours && typeof businessRaw.openingHours === "object"
      ? businessRaw.openingHours
      : {};

  const location = businessRaw.location || {};
  const locationLabel =
    location.addressLine ||
    [location.ward, location.subCounty, location.county].filter(Boolean).join(", ") ||
    location.locationDescription ||
    [businessRaw.ward, businessRaw.subCounty, businessRaw.county].filter(Boolean).join(", ") ||
    businessRaw.locationDescription ||
    null;

  const hasCoordinates =
    typeof location.lat === "number" && typeof location.lng === "number";

  const locationLink = hasCoordinates
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  const business = {
    ...businessRaw,
    openingHours,
    locationLabel,
    locationLink,
    depositRequired: Boolean(businessRaw.depositPolicy?.enabled),
  };

  if (process.env.NODE_ENV === "development") {
    business.access = { status: "ACTIVE" };
  }

  const servicesRaw = await Service.find({ businessId: business._id }).lean();
  const services = servicesRaw.map((service) => ({
    ...service,
    _id: service._id.toString(),
    businessId: service.businessId?.toString?.() || business._id.toString(),
    businessDepositPolicy: businessRaw.depositPolicy
      ? {
          enabled: Boolean(businessRaw.depositPolicy.enabled),
          type: businessRaw.depositPolicy.type,
          value: Number(businessRaw.depositPolicy.value || 0),
          applyToCallout: Boolean(businessRaw.depositPolicy.applyToCallout),
        }
      : undefined,
  }));

  const referenceImagesRaw = await ReferenceImage.find({ businessId: business._id }).lean();
  const referenceImages = referenceImagesRaw.map((image) => ({
    ...image,
    _id: image._id.toString(),
  }));

  return {
    business,
    services,
    referenceImages,
  };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { username } = await props.params;
  const pageData = await getPageData(username);

  if (!pageData) {
    return {
      title: "Business not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildBusinessMetadata(pageData.business, pageData.services);
}

export default async function PublicBookingPage(props: PageProps) {
  const { username } = await props.params;
  if (!username) notFound();

  const pageData = await getPageData(username);
  if (!pageData) notFound();

  const { business, services, referenceImages } = pageData;
  const status = business.access?.status || "ACTIVE";
  const theme = getTheme(business);
  const seo = buildBusinessSeoCopy(business, services);
  const structuredData = buildBusinessStructuredData(business, services);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicBookingPageClient
        business={business}
        status={status}
        services={services}
        referenceImages={referenceImages}
        theme={theme}
        seo={{
          businessName: seo.businessName,
          location: seo.location,
          serviceNames: seo.serviceNames,
          summarySentence: seo.summarySentence,
          searchDescription: seo.searchDescription,
          searchIntentPhrases: seo.searchIntentPhrases,
        }}
      />
    </>
  );
}
