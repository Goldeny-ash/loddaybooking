import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";
import {SubscriptionTransaction} from "@/lib/models/SubscriptionTransaction";

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

    const subscription = await Subscription.findOne({ subscriptionId });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const response = await axios.get(
      `https://api.intasend.com/api/v1/subscriptions/${subscriptionId}/transactions/`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        },
      }
    );

    const transactions = response.data;

    for (const tx of transactions) {
      await SubscriptionTransaction.updateOne(
        { providerTransactionId: tx.id },
        {
          businessId: subscription.businessId,
          subscriptionId,
          grossAmount: parseFloat(tx.amount),
          providerFee: parseFloat(tx.fees || 0),
          netAmount: parseFloat(tx.amount) - parseFloat(tx.fees || 0),
          currency: tx.currency,
          status: tx.status,
          paymentMethod: tx.payment_method,
          chargedAt: tx.created_at,
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Sync Transactions Error:", error.message);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
