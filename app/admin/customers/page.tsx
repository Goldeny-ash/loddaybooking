import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { currentUser } from "@clerk/nextjs/server";
import CustomersListClient from "@/components/admin/CustomersListClient";

export default async function AdminCustomersPage() {
  const user = await currentUser();

  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  await connectDB();

  const businesses = await Business.find()
    .select("name email access.status access.billing.customerId")
    .sort({ createdAt: -1 })
    .lean();

  return <CustomersListClient businesses={businesses} />;
}
