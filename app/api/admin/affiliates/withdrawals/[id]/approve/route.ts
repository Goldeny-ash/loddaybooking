import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateWithdrawal from "@/lib/models/AffiliateWithdrawal";

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, "").replace("+", "");
  if (cleaned.startsWith("07")) return `254${cleaned.slice(1)}`;
  return cleaned;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;

  const withdrawal = await AffiliateWithdrawal.findById(id);
  if (!withdrawal) {
    return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
  }

  if (withdrawal.status !== "REQUESTED") {
    return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
  }

  const affiliate = await Affiliate.findById(withdrawal.affiliateId);
  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  if ((affiliate.availableBalance || 0) < withdrawal.amount) {
    return NextResponse.json({ error: "Insufficient affiliate balance" }, { status: 400 });
  }

  const baseUrl =
    process.env.INTASEND_TEST === "true"
      ? "https://sandbox.intasend.com"
      : "https://api.intasend.com";

  const disburseResponse = await fetch(`${baseUrl}/api/v1/send-money/initiate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
    },
    body: JSON.stringify({
      provider: "MPESA-B2C",
      currency: "KES",
      requires_approval: "NO",
      transactions: [
        {
          name: affiliate.name,
          account: normalizePhone(withdrawal.phoneNumber),
          amount: withdrawal.amount,
          narrative: "Affiliate commission payout",
        },
      ],
    }),
  });

  const disburseData = await disburseResponse.json();
  if (!disburseResponse.ok) {
    return NextResponse.json(
      { error: "Disbursement failed", details: disburseData },
      { status: 502 }
    );
  }

  affiliate.availableBalance = (affiliate.availableBalance || 0) - withdrawal.amount;
  affiliate.paidOutTotal = (affiliate.paidOutTotal || 0) + withdrawal.amount;

  withdrawal.status = "DISBURSED";
  withdrawal.approvedAt = new Date();
  withdrawal.disbursedAt = new Date();
  withdrawal.disbursementReference = disburseData?.tracking_id || disburseData?.id;

  await Promise.all([affiliate.save(), withdrawal.save()]);

  return NextResponse.json({ success: true, withdrawal });
}
