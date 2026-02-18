// app/admin/subscriptions/plans/page.tsx

import { connectDB } from "@/lib/mongoDB";
import {SubscriptionPlan} from "@/lib/models/SubscriptionPlan";
import { currentUser } from "@clerk/nextjs/server";
import PlansListClient from "@/components/admin/PlansListClient";

export default async function AdminPlansPage() {
  const user = await currentUser();

  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  await connectDB();

  const plans = await SubscriptionPlan.find()
    .sort({ createdAt: -1 })
    .lean();

  return <PlansListClient plans={plans} />;
}
