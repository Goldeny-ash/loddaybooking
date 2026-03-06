// app/b/[username]/select/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { getTheme } from "@/lib/theme";
import BookingClient from "@/components/public/BookingClient";

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
  const business = await Business.findOne({ username }).select("name").lean();

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

  // ---------------- DB: Fetch business only ----------------
  await connectDB();
  const business = await Business.findOne({ username }).lean();
  if (!business) return notFound();

  // ---------------- THEME ----------------
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
