import TransactionsListClient from "@/components/admin/TransactionsListClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import {SubscriptionTransaction }from "@/lib/models/SubscriptionTransaction";
import Business from "@/lib/models/Business";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage({
  searchParams,
}: any) {
  await requirePlatformOwner();
  await connectDB();

  const filter: any = {};

  // Filter by business
  if (searchParams.businessId) {
    filter.businessId = searchParams.businessId;
  }

  // Filter by date range
  if (searchParams.from && searchParams.to) {
    filter.chargedAt = {
      $gte: new Date(searchParams.from),
      $lte: new Date(searchParams.to),
    };
  }

  const transactions = await SubscriptionTransaction.find(filter)
    .sort({ chargedAt: -1 })
    .lean();

  const businesses = await Business.find()
    .select("name")
    .lean();

  return (
    <TransactionsListClient
      transactions={transactions}
      businesses={businesses}
    />
  );
}
