import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import AffiliateDetailClient from "@/components/admin/AffiliateDetailClient";
import { connectDB } from "@/lib/mongoDB";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateCommission from "@/lib/models/AffiliateCommission";
import AffiliateWithdrawal from "@/lib/models/AffiliateWithdrawal";
import AffiliateReferralUse from "@/lib/models/AffiliateReferralUse";
import Business from "@/lib/models/Business";

export default async function AdminAffiliateDetailPage({
  params,
}: {
  params: Promise<{ affiliateId: string }>;
}) {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    notFound();
  }

  await connectDB();
  const { affiliateId } = await params;

  const affiliate = await Affiliate.findById(affiliateId).lean();
  if (!affiliate) notFound();

  const [commissions, withdrawals, referralUses, directBusinesses] = await Promise.all([
    AffiliateCommission.find({ affiliateId }).lean(),
    AffiliateWithdrawal.find({ affiliateId }).lean(),
    AffiliateReferralUse.find({ affiliateId }).sort({ createdAt: -1 }).lean(),
    Business.find({ referredBy: affiliateId })
      .select("name username access createdAt")
      .lean(),
  ]);

  const referralBusinessIds = referralUses.map((item) => item.businessId).filter(Boolean);
  const fallbackBusinesses = referralBusinessIds.length
    ? await Business.find({ _id: { $in: referralBusinessIds } })
        .select("name username access createdAt")
        .lean()
    : [];

  const businessMap = new Map<string, any>();
  for (const business of [...directBusinesses, ...fallbackBusinesses]) {
    businessMap.set(String(business._id), business);
  }

  const referredBusinesses = referralUses.map((referralUse) => {
    const business = businessMap.get(String(referralUse.businessId));
    return {
      id: String(referralUse.businessId),
      name: business?.name || "Referred business",
      ownerName: undefined,
      referredAt: referralUse.createdAt ? new Date(referralUse.createdAt).toISOString() : undefined,
      bookingLink: business?.username ? `https://booking.lodday.com/b/${business.username}` : undefined,
      status: business?.access?.status || "INACTIVE",
    };
  });

  const missingDirectBusinesses = directBusinesses
    .filter((business) => !referredBusinesses.some((item) => item.id === String(business._id)))
    .map((business) => ({
      id: String(business._id),
      name: business.name || "Referred business",
      ownerName: undefined,
      referredAt: business.createdAt ? new Date(business.createdAt).toISOString() : undefined,
      bookingLink: business.username ? `https://booking.lodday.com/b/${business.username}` : undefined,
      status: business.access?.status || "INACTIVE",
    }));

  const pendingEarnings = commissions
    .filter((commission) => commission.status === "PENDING")
    .reduce((sum, commission) => sum + Number(commission.amount || 0), 0);

  return (
    <AffiliateDetailClient
      affiliate={{
        id: String(affiliate._id),
        name: affiliate.name || "Affiliate",
        email: affiliate.email || "",
        phone: affiliate.phone || "",
        status: affiliate.status || "PENDING",
        createdAt: affiliate.createdAt ? new Date(affiliate.createdAt).toISOString() : new Date().toISOString(),
        referralCode: affiliate.referralCode,
        totalEarned: Number(affiliate.totalEarned || 0),
        availableBalance: Number(affiliate.availableBalance || 0),
        paidOutTotal: Number(affiliate.paidOutTotal || 0),
      }}
      referredBusinesses={[...referredBusinesses, ...missingDirectBusinesses]}
      pendingEarnings={pendingEarnings}
    />
  );
}
