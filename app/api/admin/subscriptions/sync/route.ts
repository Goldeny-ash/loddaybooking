import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";

export async function GET() {
  try {
    await connectDB();

    const response = await axios.get(
      "https://api.intasend.com/api/v1/subscriptions/",
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        },
      }
    );

    const subscriptions = response.data;

    for (const sub of subscriptions) {
      await Subscription.updateOne(
        { subscriptionId: sub.subscription_id },
        {
          status: sub.status,
          providerUpdatedAt: sub.updated_at,
        },
        { upsert: false }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Sync Subscriptions Error:", error.message);
    return NextResponse.json(
      { error: "Failed to sync subscriptions" },
      { status: 500 }
    );
  }
}
