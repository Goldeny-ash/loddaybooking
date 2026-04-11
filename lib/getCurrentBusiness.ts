import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export async function getCurrentBusiness(options?: {
  requireActiveSubscription?: boolean;
  requireSetup?: boolean;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();

  const business = await Business.findOne({ clerkUserId: userId });

  if (!business) return null;

  const now = new Date();

  // 🔄 Auto-expire trial
  if (
    business.access?.status === "TRIAL" &&
    business.access.trialEndsAt &&
    business.access.trialEndsAt < now
  ) {
    business.access.status = "EXPIRED";
    await business.save();
  }

  if (options?.requireSetup && !business.username) {
    throw new Error("BUSINESS_NOT_SETUP");
  }

  if (
    options?.requireActiveSubscription &&
    !["ACTIVE", "TRIAL"].includes(business.access.status) &&
    !business.adminBenefits?.demoBusiness
  ) {
    throw new Error("SUBSCRIPTION_REQUIRED");
  }

  return business;
}
