import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoDB";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateCommission from "@/lib/models/AffiliateCommission";
import AffiliateWithdrawal from "@/lib/models/AffiliateWithdrawal";

function remainingCommissionAmount(commission: {
  amount?: number;
  withdrawnAmount?: number;
}) {
  return Math.max(0, Number(commission.amount || 0) - Number(commission.withdrawnAmount || 0));
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const code = request.nextUrl.searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json({ error: "Access code is required." }, { status: 400 });
    }

    const affiliate = await Affiliate.findOne({ accessCode: code });

    if (!affiliate || !["APPROVED", "PAUSED"].includes(affiliate.status)) {
      return NextResponse.json({ error: "Affiliate not found." }, { status: 404 });
    }

    const now = new Date();

    await AffiliateCommission.updateMany(
      {
        affiliateId: affiliate._id,
        status: "PENDING",
        availableAt: { $lte: now },
      },
      {
        $set: { status: "AVAILABLE" },
      }
    );

    const [commissions, withdrawals] = await Promise.all([
      AffiliateCommission.find({ affiliateId: affiliate._id }).sort({ createdAt: -1 }).lean(),
      AffiliateWithdrawal.find({ affiliateId: affiliate._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const withdrawableAmount = commissions
      .filter((commission) => commission.status === "AVAILABLE")
      .reduce((sum, commission) => sum + remainingCommissionAmount(commission), 0);

    const pendingAmount = commissions
      .filter((commission) => commission.status === "PENDING")
      .reduce((sum, commission) => sum + remainingCommissionAmount(commission), 0);

    const withdrawnAmount = commissions.reduce(
      (sum, commission) => sum + Number(commission.withdrawnAmount || 0),
      0
    );

    const totalEarned = commissions.reduce((sum, commission) => sum + Number(commission.amount || 0), 0);

    return NextResponse.json({
      affiliate: typeof affiliate.toObject === "function" ? affiliate.toObject() : affiliate,
      commissions,
      withdrawals,
      referralCount: commissions.length,
      totalEarned,
      withdrawableAmount,
      pendingAmount,
      withdrawnAmount,
    });
  } catch (error) {
    console.error("affiliate-me", error);
    return NextResponse.json({ error: "Unable to load affiliate profile." }, { status: 500 });
  }
}
