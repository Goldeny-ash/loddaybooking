import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";
import Business from "@/lib/models/Business";

/*
 * IMPORTANT:
 * We must read raw body for signature verification.
 */

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const signature = req.headers.get("x-intasend-signature");

    /*
     * -----------------------------
     * Verify Signature (if provided)
     * -----------------------------
     */

    if (process.env.INTASEND_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.INTASEND_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);

    await connectDB();

    const { subscription_id, status } = payload;

    if (!subscription_id) {
      return NextResponse.json(
        { error: "Missing subscription_id" },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({
      subscriptionId: subscription_id,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const business = await Business.findById(subscription.businessId);

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    /*
     * Idempotency check
     */
    if (subscription.status === status) {
      return NextResponse.json({ received: true });
    }

    const now = new Date();

    switch (status) {
      case "ACTIVE":
        subscription.status = "ACTIVE";
        subscription.lastChargeAt = now;

        business.access.status = "ACTIVE";
        business.access.subscriptionId = subscription.subscriptionId;
        business.access.planId = subscription.planId;
        business.access.lastChargeAt = now;
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
        break;
    }

    await subscription.save();
    await business.save();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json(
      { error: "Webhook failed" },
      { status: 500 }
    );
  }
}
