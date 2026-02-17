// app/b/[username]/select/page.tsx
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { getTheme } from "@/lib/theme";
import BookingClient from "@/components/public/BookingClient";

interface PageProps {
  params: Promise<{ username: string }>;
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

      <div className="max-w-xl mx-auto p-6">
        <BookingClient username={username} business={business} />
      </div>
    </>
  );
}
