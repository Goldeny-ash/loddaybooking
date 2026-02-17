// app/admin/refunds/page.tsx
import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";
import { currentUser } from "@clerk/nextjs/server";
import RefundsList from "@/components/admin/RefundsListClient";

export default async function AdminRefundsPage() {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  await connectDB();

  // Fetch all refunds with booking populated
  const refunds = await Refund.find()
    .populate("bookingId")
    .sort({ createdAt: -1 })
    .lean();

  // Pass to client component for interaction
  return <RefundsList refunds={refunds} />;
}
