import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoDB";
import AffiliateWithdrawal from "@/lib/models/AffiliateWithdrawal";

const PLATFORM_OWNER_CLERK_ID = process.env.PLATFORM_OWNER_CLERK_ID;

async function isPlatformOwner() {
  const [{ userId }, user] = await Promise.all([auth(), currentUser()]);

  if (!userId || !user) {
    return false;
  }

  return Boolean(PLATFORM_OWNER_CLERK_ID && user.id === PLATFORM_OWNER_CLERK_ID);
}

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isPlatformOwner())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;

    const withdrawal = await AffiliateWithdrawal.findById(id);

    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found." }, { status: 404 });
    }

    withdrawal.status = "PAID";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin-affiliate-withdrawal-approve", error);
    return NextResponse.json({ error: "Unable to approve withdrawal." }, { status: 500 });
  }
}
