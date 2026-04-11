import CustomersListClient from "@/components/admin/CustomersListClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requirePlatformOwner();
  await connectDB();

  const businessDocs = await Business.find()
    .select(
      "name email username access.status access.subscriptionExpiresAt access.nextChargeAt access.billing.customerId marketplaceVisible marketplaceStatus adminBenefits"
    )
    .sort({ createdAt: -1 })
    .lean();

  const businesses = businessDocs.map((business) => ({
    _id: business._id.toString(),
    name: business.name || "",
    email: business.email || "",
    username: business.username || "",
    marketplaceVisible: Boolean(business.marketplaceVisible),
    marketplaceStatus: business.marketplaceStatus || "none",
    access: {
      status: business.access?.status || "INACTIVE",
      subscriptionExpiresAt: business.access?.subscriptionExpiresAt
        ? new Date(business.access.subscriptionExpiresAt).toISOString()
        : undefined,
      nextChargeAt: business.access?.nextChargeAt
        ? new Date(business.access.nextChargeAt).toISOString()
        : undefined,
      billing: {
        customerId: business.access?.billing?.customerId || "",
      },
    },
    adminBenefits: {
      demoBusiness: Boolean(business.adminBenefits?.demoBusiness),
      freeMonthGrantedAt: business.adminBenefits?.freeMonthGrantedAt
        ? new Date(business.adminBenefits.freeMonthGrantedAt).toISOString()
        : undefined,
      freeMonthEndsAt: business.adminBenefits?.freeMonthEndsAt
        ? new Date(business.adminBenefits.freeMonthEndsAt).toISOString()
        : undefined,
    },
  }));

  return <CustomersListClient businesses={businesses} />;
}
