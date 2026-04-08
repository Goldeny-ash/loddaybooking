import SubscriptionsListClient from "@/components/admin/SubscriptionsListClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  await requirePlatformOwner();
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
