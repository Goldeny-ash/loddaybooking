import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateWithdrawal from "@/lib/models/AffiliateWithdrawal";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const accessCode = String(body.accessCode || "").trim().toUpperCase();
  const amount = Number(body.amount || 0);
  const phoneNumber = String(body.phoneNumber || "").trim();

  if (!accessCode || !amount || !phoneNumber) {
    return NextResponse.json({ error: "accessCode, amount, phoneNumber required" }, { status: 400 });
  }

  const affiliate = await Affiliate.findOne({ accessCode });
  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  if (amount <= 0 || amount > (affiliate.availableBalance || 0)) {
    return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
  }

  const request = await AffiliateWithdrawal.create({
    affiliateId: affiliate._id,
    amount,
    phoneNumber,
    status: "REQUESTED",
  });

  return NextResponse.json({ success: true, request });
}
