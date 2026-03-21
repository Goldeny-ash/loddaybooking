import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lodday Affiliates | Refer Businesses and Earn",
  description:
    "Apply to join the Lodday affiliate program, refer businesses, and earn commissions on successful subscriptions.",
  alternates: {
    canonical: "https://affiliates.lodday.com",
  },
  openGraph: {
    title: "Lodday Affiliates | Refer Businesses and Earn",
    description:
      "Apply to join the Lodday affiliate program, refer businesses, and earn commissions on successful subscriptions.",
    url: "https://affiliates.lodday.com",
    siteName: "Lodday Affiliates",
    type: "website",
  },
};

export default function AffiliatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
