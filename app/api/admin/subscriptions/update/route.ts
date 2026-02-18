import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";


export async function PUT(req: Request) {
  try {
    await connectDB();

    const { subscriptionId, startDate } = await req.json();

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
     * Call IntaSend Update
     */
    const response = await axios.put(
      `https://api.intasend.com/api/v1/subscriptions/${subscriptionId}/`,
      {
        start_date: startDate,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const updated = response.data;

    /*
     * Update Local Snapshot
     */
    subscription.startsAt = updated.start_date;
    subscription.providerUpdatedAt = updated.updated_at;

    await subscription.save();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Update Subscription Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
