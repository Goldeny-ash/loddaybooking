import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";
import Deposit from "@/lib/models/Deposit";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requirePlatformOwner();
  await connectDB();

  const { id } = await context.params;

  const refund = await Refund.findById(id);
  if (!refund) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  refund.status = "FAILED";
  refund.failedAt = new Date();
  refund.failureReason = "Admin refused refund";
  await refund.save();

  await Deposit.findByIdAndUpdate(refund.depositId, {
    refundLocked: false,
  });

  return NextResponse.json({ success: true });
}
