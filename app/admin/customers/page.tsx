import CustomersListClient from "@/components/admin/CustomersListClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requirePlatformOwner();
  await connectDB();

  const businesses = await Business.find()
    .select("name email access.status access.billing.customerId")
    .sort({ createdAt: -1 })
    .lean();

  return <CustomersListClient businesses={businesses} />;
}
