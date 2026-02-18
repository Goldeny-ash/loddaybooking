// app/api/subscription/cancel/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";

export async function POST() {
  try {
    const user = await currentUser();
    if (!user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const business = await Business.findOne({
      clerkUserId: user.id,
    });

    if (!business)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const subscription = await Subscription.findOne({
      businessId: business._id,
    });

    if (!subscription)
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });

    await axios.post(
      `https://api.intasend.com/api/v1/subscriptions/${subscription.subscriptionId}/unsubscribe/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Cancel failed" },
      { status: 500 }
    );
  }
}
