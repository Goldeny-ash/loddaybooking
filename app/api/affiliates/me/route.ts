import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateCommission from "@/lib/models/AffiliateCommission";
import AffiliateWithdrawal from "@/lib/models/AffiliateWithdrawal";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = String(searchParams.get("code") || "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Affiliate code is required" }, { status: 400 });
  }

  await connectDB();

  const affiliate = await Affiliate.findOne({ accessCode: code }).lean();
  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  const [commissions, withdrawals] = await Promise.all([
    AffiliateCommission.find({ affiliateId: affiliate._id })
      .sort({ createdAt: -1 })
      .lean(),
    AffiliateWithdrawal.find({ affiliateId: affiliate._id })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return NextResponse.json({
    affiliate,
    commissions,
    withdrawals,
  });
}
