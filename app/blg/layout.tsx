import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://blog.lodday.com"),
  title: {
    default: "Lodday Blog | Service Business Growth & Style Trends in Kenya",
    template: "%s | Lodday Blog",
  },
  description:
    "Learn how to get more clients, showcase your work, spot trends in Kenya, and grow with practical Lodday blog content.",
  alternates: {
    canonical: "https://blog.lodday.com",
  },
  openGraph: {
    title: "Lodday Blog | Service Business Growth & Style Trends in Kenya",
    description:
      "Growth guides, affiliate playbooks, and trending style ideas for Kenyan service businesses.",
    url: "https://blog.lodday.com",
    siteName: "Lodday Blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lodday Blog | Service Business Growth & Style Trends in Kenya",
    description:
      "Growth guides, affiliate playbooks, and trending style ideas for Kenyan service businesses.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
