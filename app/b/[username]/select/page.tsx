// app/b/[username]/select/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { usernameToSubdomain } from "@/lib/subdomain";
import { getTheme } from "@/lib/theme";
import BookingClient from "@/components/public/BookingClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { username } = await props.params;

  if (!username) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  await connectDB();
  const business = await Business.findOne({
    $or: [{ username }, { subdomain: usernameToSubdomain(username) }],
  })
    .select("name")
    .lean();

  const businessName = business?.name || username;

  return {
    title: `Complete booking with ${businessName}`,
    description: `Choose services and complete your appointment request with ${businessName}.`,
    alternates: {
      canonical: `/b/${encodeURIComponent(username)}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function BookingPage(props: PageProps) {
  const { username } = await props.params;
  if (!username) return notFound();

  await connectDB();
  const businessDoc = await Business.findOne({
    $or: [{ username }, { subdomain: usernameToSubdomain(username) }],
  });
  if (!businessDoc) return notFound();

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

  const theme = getTheme(business);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --brand-primary: ${theme.primary};
              --brand-primary-light: ${theme.primaryLight};
              --brand-primary-dark: ${theme.primaryDark};
              --brand-accent: ${theme.accent};
              --brand-accent-light: ${theme.accentLight};
              --brand-accent-dark: ${theme.accentDark};
              --brand-bg-soft: ${theme.backgroundSoft};
            }
          `,
        }}
      />

      <div className="min-h-screen w-full">
        <BookingClient username={username} business={business} />
      </div>
    </>
  );
}
