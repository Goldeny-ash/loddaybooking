import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";

export async function POST() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const business = await Business.findOne({ clerkUserId: user.id });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const subscription = await Subscription.findOne({
      businessId: business._id.toString(),
      status: { $in: ["ACTIVE", "PENDING"] },
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    subscription.status = "CANCELED";
    await subscription.save();

    business.access.status = "EXPIRED";
    await business.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/subscription/cancel failed:", error);
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
