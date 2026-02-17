import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";

export async function GET() {
  try {
    await requirePlatformOwner(); // throws if not platform owner
    await connectDB();

    // Fetch refunds + populate booking details
    const refunds = await Refund.find()
      .populate("bookingId")
      .sort({ createdAt: -1 });

    return NextResponse.json(refunds);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
