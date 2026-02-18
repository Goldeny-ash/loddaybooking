import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { currentUser } from "@clerk/nextjs/server";
import SubscriptionsListClient from "@/components/admin/SubscriptionsListClient";

export default async function AdminSubscriptionsPage() {
  const user = await currentUser();

  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  await connectDB();

  const businesses = await Business.find({
    "access.subscriptionId": { $exists: true, $ne: null },
  })
    .select(
      "name access.status access.planId access.subscriptionId access.subscriptionExpiresAt access.nextChargeAt"
    )
    .lean();

  return <SubscriptionsListClient businesses={businesses} />;
}
