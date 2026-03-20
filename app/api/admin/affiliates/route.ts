import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateReferralUse from "@/lib/models/AffiliateReferralUse";
import { connectDB } from "@/lib/mongoDB";
import {
  AFFILIATE_DASHBOARD_URL,
  generateAffiliateCode,
  sendAffiliateApprovalEmail,
  sendAffiliateRejectionEmail,
} from "@/lib/affiliates";

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function ensureUniqueCode(field: "accessCode" | "referralCode", prefix: "A" | "R") {
  let code = "";

  do {
    code = generateAffiliateCode(prefix);
  } while (await Affiliate.findOne({ [field]: code }));

  return code;
}

export async function GET() {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const [affiliates, referralCounts] = await Promise.all([
    Affiliate.find()
      .select("-idDocumentData")
      .sort({ createdAt: -1 })
      .lean(),
    AffiliateReferralUse.aggregate([
      {
        $group: {
          _id: "$affiliateId",
          referralCount: { $sum: 1 },
          latestReferralAt: { $max: "$createdAt" },
        },
      },
    ]),
  ]);

  const referralMap = new Map<string, { referralCount: number; latestReferralAt?: string }>();
  for (const item of referralCounts) {
    const affiliateId = item._id?.toString?.();
    if (!affiliateId) continue;
    referralMap.set(affiliateId, {
      referralCount: Number(item.referralCount) || 0,
      latestReferralAt: item.latestReferralAt ? new Date(item.latestReferralAt).toISOString() : undefined,
    });
  }

  return NextResponse.json({
    affiliates: affiliates.map((affiliate) => {
      const stats = referralMap.get(String(affiliate._id));
      return {
        ...affiliate,
        referralCount: stats?.referralCount || 0,
        latestReferralAt: stats?.latestReferralAt,
      };
    }),
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json().catch(() => ({}));
  const affiliateId = String(body.affiliateId || "").trim();
  const action = String(body.action || "").trim().toLowerCase();

  if (!affiliateId || !["approve", "reject", "pause", "resume"].includes(action)) {
    return NextResponse.json({ error: "affiliateId and a valid action are required." }, { status: 400 });
  }

  const affiliate = await Affiliate.findById(affiliateId);
  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  if (action === "approve") {
    affiliate.referralCode = await ensureUniqueCode("referralCode", "R");
    affiliate.accessCode = await ensureUniqueCode("accessCode", "A");
    affiliate.status = "APPROVED";
    affiliate.approvedAt = new Date();
    affiliate.rejectedAt = undefined;
    affiliate.performanceReviewDueAt = addMonths(
      affiliate.createdAt instanceof Date ? affiliate.createdAt : new Date(),
      2
    );
    await affiliate.save();

    await sendAffiliateApprovalEmail({
      email: affiliate.email,
      name: affiliate.name,
      referralCode: affiliate.referralCode,
      accessCode: affiliate.accessCode,
    }).catch((error) => {
      console.error("Affiliate approval email failed", error);
    });

    return NextResponse.json({
      success: true,
      affiliate,
      message: "Affiliate approved and notified.",
      dashboardUrl: AFFILIATE_DASHBOARD_URL,
    });
  }

  if (action === "reject") {
    affiliate.status = "REJECTED";
    affiliate.rejectedAt = new Date();
    affiliate.referralCode = null;
    affiliate.accessCode = null;
    await affiliate.save();

    await sendAffiliateRejectionEmail({
      email: affiliate.email,
      name: affiliate.name,
    }).catch((error) => {
      console.error("Affiliate rejection email failed", error);
    });

    return NextResponse.json({ success: true, affiliate, message: "Affiliate rejected and notified." });
  }

  affiliate.status = action === "pause" ? "PAUSED" : "APPROVED";
  await affiliate.save();

  return NextResponse.json({
    success: true,
    affiliate,
    message: action === "pause" ? "Affiliate paused." : "Affiliate resumed.",
  });
}
