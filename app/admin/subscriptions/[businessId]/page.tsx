import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { currentUser } from "@clerk/nextjs/server";
import SubscriptionDetailsClient from "@/components/admin/SubscriptionDetailsClient";

export default async function SubscriptionDetailsPage(
  { params }: any
) {
  const user = await currentUser();

  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  await connectDB();

  const business = await Business.findById(params.businessId).lean();

  if (!business) {
    throw new Error("NOT FOUND");
  }

  return (
    <SubscriptionDetailsClient business={business} />
  );
}
