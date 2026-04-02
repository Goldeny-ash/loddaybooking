import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";
import { currentUser } from "@clerk/nextjs/server";
import RefundsList from "@/components/admin/RefundsListClient";

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage() {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  await connectDB();

  const refunds = await Refund.find()
    .populate("bookingId")
    .populate("depositId")
    .sort({ createdAt: -1 })
    .lean();

  return <RefundsList refunds={JSON.parse(JSON.stringify(refunds))} />;
}
