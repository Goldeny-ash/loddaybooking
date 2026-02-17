import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lodday Booking",
  description: "One link to get booked",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
