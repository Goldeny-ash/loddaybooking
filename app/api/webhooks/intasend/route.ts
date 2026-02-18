import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";
import Business from "@/lib/models/Business";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-intasend-signature");

    if (process.env.INTASEND_WEBHOOK_SECRET && signature) {
      const expected = crypto
        .createHmac("sha256", process.env.INTASEND_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (signature.trim().toLowerCase() !== expected.trim().toLowerCase()) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let payload: any = null;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ received: true });
    }

    const subscriptionId = payload?.subscription_id;
    const providerStatus = payload?.status;

    if (!subscriptionId || !providerStatus) {
      return NextResponse.json({ received: true });
    }

    await connectDB();

    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      return NextResponse.json({ received: true });
    }

    const business = await Business.findById(subscription.businessId);
    if (!business) {
      return NextResponse.json({ received: true });
    }

    if (subscription.status === providerStatus) {
      return NextResponse.json({ received: true });
    }

    if (!business.access) {
      business.access = { status: "TRIAL" };
    }

    const now = new Date();

    switch (providerStatus) {
      case "ACTIVE":
        subscription.status = "ACTIVE";
        subscription.lastChargeAt = now;
        if (payload?.next_date) {
          subscription.nextChargeAt = new Date(payload.next_date);
        }

        business.access.status = "ACTIVE";
        business.access.subscriptionId = subscription.subscriptionId;
        business.access.planId = subscription.planId;
        business.access.lastChargeAt = now;
        if (payload?.next_date) {
          business.access.nextChargeAt = new Date(payload.next_date);
        }
        break;

      case "PENDING":
        subscription.status = "PENDING";
        business.access.status = "INACTIVE";
        break;

      case "FAILED":
        subscription.status = "FAILED";
        business.access.status = "GRACE";
        business.access.graceStartedAt = now;
        break;

      case "CANCELED":
        subscription.status = "CANCELED";
        business.access.status = "EXPIRED";
        break;

      case "EXPIRED":
        subscription.status = "EXPIRED";
        business.access.status = "EXPIRED";
        break;

      default:
        return NextResponse.json({ received: true });
    }

    await subscription.save();
    await business.save();

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("IntaSend webhook error:", error?.message || error);
    return NextResponse.json({ received: true });
  }
}
