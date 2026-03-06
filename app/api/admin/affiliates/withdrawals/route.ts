import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import AffiliateWithdrawal from "@/lib/models/AffiliateWithdrawal";

export async function GET() {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const withdrawals = await AffiliateWithdrawal.find()
    .populate("affiliateId", "name email phone")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ withdrawals });
}
