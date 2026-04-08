import SubscriptionDetailsClient from "@/components/admin/SubscriptionDetailsClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export const dynamic = "force-dynamic";

export default async function SubscriptionDetailsPage(
  { params }: any
) {
  await requirePlatformOwner();
  await connectDB();

  const { businessId } = await params;

  const business = await Business.findById(businessId).lean();

  if (!business) {
    throw new Error("NOT FOUND");
  }

  return (
    <SubscriptionDetailsClient business={business} />
  );
}
