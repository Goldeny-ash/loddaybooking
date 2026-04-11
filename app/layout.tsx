import type { Metadata } from "next";
import { Suspense } from "react";
import { Inria_Serif } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { getSiteUrl } from "@/lib/seo";
import SupportBubble from "@/components/support/SupportBubble";

const inriaSerif = Inria_Serif({
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-inria-serif",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  manifest: "/site.webmanifest",
  title: {
    default: "Lodday Booking | Online Booking for Service Businesses",
    template: "%s | Lodday Booking",
  },
  description:
    "Lodday Booking helps salons, nail techs, beauty studios, and service businesses accept bookings online with branded booking pages.",
  applicationName: "Lodday Booking",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  alternates: {
    canonical: "/",
  },
  keywords: [
    "online booking",
    "appointment scheduling",
    "beauty booking software",
    "salon booking page",
    "nail salon bookings",
    "lodday booking",
  ],
  openGraph: {
    title: "Lodday Booking | Online Booking for Service Businesses",
    description:
      "Create branded booking pages, publish your services, and accept appointments online with Lodday Booking.",
    url: siteUrl,
    siteName: "Lodday Booking",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lodday Booking | Online Booking for Service Businesses",
    description:
      "Create branded booking pages, publish your services, and accept appointments online with Lodday Booking.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inriaSerif.variable}>
      <body className={`${inriaSerif.className} antialiased`}>
        <ClerkProvider>
          {children}
          <Suspense fallback={null}>
            <SupportBubble />
          </Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}
