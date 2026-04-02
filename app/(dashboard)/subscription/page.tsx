// app/dashboard/subscription/page.tsx

import { connectDB } from "@/lib/mongoDB";
import { currentUser } from "@clerk/nextjs/server";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";
import SubscriptionManagerClient from "@/components/dashboard/SubscriptionManagerClient";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const user = await currentUser();
  if (!user?.id) throw new Error("UNAUTHORIZED");

  await connectDB();

  const business = await Business.findOne({
    clerkUserId: user.id,
  }).lean();

  if (!business) throw new Error("Business not found");

  const subscription = await Subscription.findOne({
    businessId: business._id,
  }).lean();

  return (
    <SubscriptionManagerClient
      business={business}
      subscription={subscription}
    />
  );
}
