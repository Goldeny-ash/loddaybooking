import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";
import Business from "@/lib/models/Business";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID required" },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({
      subscriptionId,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    /*
     * Call IntaSend Unsubscribe
     */
    const response = await axios.post(
      `https://api.intasend.com/api/v1/subscriptions/${subscriptionId}/unsubscribe/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    /*
     * Update Local Immediately
     * (Webhook will also confirm)
     */
    subscription.status = "CANCELED";
    await subscription.save();

    const business = await Business.findById(subscription.businessId);

    if (business) {
      business.access.status = "EXPIRED";
      await business.save();
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Cancel Subscription Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Cancellation failed" },
      { status: 500 }
    );
  }
}
