import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import SetupClient from "@/components/setup/SetupClient";

export default async function SetupPage() {
  const { userId } = await auth();

  // Preserve original path + query string
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") || "/setup";
  const search = hdrs.get("x-search") || "";
  const returnUrl = pathname + search;

  // NOT signed in → go to sign-in with mode intact
  if (!userId) {
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`
    );
  }

  await connectDB();

  const business = await Business.findOne({ clerkUserId: userId });

  // Already onboarded → dashboard
  if (business) {
    redirect("/dashboard");
  }

  return <SetupClient />;
}
