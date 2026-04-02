import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { currentUser } from "@clerk/nextjs/server";
import SubscriptionsListClient from "@/components/admin/SubscriptionsListClient";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const user = await currentUser();

  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  await connectDB();

  const businesses = await Business.find({
    "access.status": { $in: ["ACTIVE", "TRIAL", "GRACE", "EXPIRED", "INACTIVE"] },
  })
    .select(
      "name access.status access.subscriptionExpiresAt access.nextChargeAt access.lastChargeAt"
    )
    .lean();

  return <SubscriptionsListClient businesses={businesses} />;
}
