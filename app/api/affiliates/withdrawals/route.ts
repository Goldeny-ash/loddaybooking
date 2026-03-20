import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoDB";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateCommission from "@/lib/models/AffiliateCommission";
import AffiliateWithdrawal from "@/lib/models/AffiliateWithdrawal";

function getRemainingAmount(commission: {
  amount?: number;
  withdrawnAmount?: number;
}) {
  return Math.max(0, Number(commission.amount || 0) - Number(commission.withdrawnAmount || 0));
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const accessCode = String(body?.accessCode || "").trim();
    const requestedAmount = Number(body?.amount || 0);

    if (!accessCode) {
      return NextResponse.json({ error: "Access code is required." }, { status: 400 });
    }

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json({ error: "Enter a valid withdrawal amount." }, { status: 400 });
    }

    const affiliate = await Affiliate.findOne({ accessCode });

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

    const commissions = await AffiliateCommission.find({
      affiliateId: affiliate._id,
      status: { $in: ["AVAILABLE", "WITHDRAWN"] },
    })
      .sort({ availableAt: 1, createdAt: 1 })
      .exec();

    const availableCommissions = commissions.filter(
      (commission) => commission.status === "AVAILABLE" && getRemainingAmount(commission) > 0
    );

    const withdrawableAmount = availableCommissions.reduce(
      (sum, commission) => sum + getRemainingAmount(commission),
      0
    );

    if (withdrawableAmount <= 0) {
      return NextResponse.json(
        { error: "No amount is available to withdraw yet." },
        { status: 400 }
      );
    }

    if (requestedAmount > withdrawableAmount) {
      return NextResponse.json(
        { error: "Requested amount exceeds your available balance." },
        { status: 400 }
      );
    }

    let remaining = requestedAmount;

    for (const commission of availableCommissions) {
      if (remaining <= 0) {
        break;
      }

      const commissionRemaining = getRemainingAmount(commission);
      const take = Math.min(commissionRemaining, remaining);

      commission.withdrawnAmount = Number(commission.withdrawnAmount || 0) + take;
      commission.status = commission.withdrawnAmount >= commission.amount ? "WITHDRAWN" : "AVAILABLE";
      remaining -= take;

      await commission.save();
    }

    await AffiliateWithdrawal.create({
      affiliateId: affiliate._id,
      amount: requestedAmount,
      requestedAt: now,
      status: "PROCESSING",
    });

    return NextResponse.json({
      success: true,
      message:
        "Withdrawal request submitted. Available commissions are released 7 days after being earned.",
    });
  } catch (error) {
    console.error("affiliate-withdrawals", error);
    return NextResponse.json({ error: "Unable to create withdrawal request." }, { status: 500 });
  }
}
