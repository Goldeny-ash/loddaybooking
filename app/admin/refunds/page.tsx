import RefundsList from "@/components/admin/RefundsListClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage() {
  await requirePlatformOwner();
  await connectDB();

  const refunds = await Refund.find()
    .populate("bookingId")
    .populate("depositId")
    .sort({ createdAt: -1 })
    .lean();

  return <RefundsList refunds={JSON.parse(JSON.stringify(refunds))} />;
}
