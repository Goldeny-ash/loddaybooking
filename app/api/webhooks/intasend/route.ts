import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";
import Business from "@/lib/models/Business";

/*
 * PRODUCTION-GRADE INTASEND WEBHOOK
 *
 * RULES:
 * 1. NEVER return 4xx/5xx (unless signature invalid)
 * 2. ALWAYS return 200 quickly
 * 3. Handle DB errors safely
 * 4. Be idempotent
 */

export async function POST(req: Request) {
  const rawBody = await req.text();

  try {
    const signature = req.headers.get("x-intasend-signature");

    /* -----------------------------
       1️⃣ VERIFY SIGNATURE (STRICT)
    ------------------------------ */
    if (process.env.INTASEND_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.INTASEND_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("❌ Invalid IntaSend signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    /* -----------------------------
       2️⃣ PARSE PAYLOAD SAFELY
    ------------------------------ */
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ Failed to parse webhook body");
      return NextResponse.json({ received: true });
    }

    console.log("📩 IntaSend webhook received:", payload);

    const { subscription_id, status } = payload;

    if (!subscription_id) {
      console.warn("⚠ Missing subscription_id");
      return NextResponse.json({ received: true });
    }

    /* -----------------------------
       3️⃣ CONNECT DB (SAFE)
    ------------------------------ */
    await connectDB();

    const subscription = await Subscription.findOne({
      subscriptionId: subscription_id,
    });

    if (!subscription) {
      console.warn("⚠ Subscription not found yet:", subscription_id);
      return NextResponse.json({ received: true });
    }

    const business = await Business.findById(subscription.businessId);

    if (!business) {
      console.warn("⚠ Business not found:", subscription.businessId);
      return NextResponse.json({ received: true });
    }

    /* -----------------------------
       4️⃣ IDEMPOTENCY CHECK
    ------------------------------ */
    if (subscription.status === status) {
      console.log("🔁 Duplicate webhook event ignored");
      return NextResponse.json({ received: true });
    }

    const now = new Date();

    /* -----------------------------
       5️⃣ HANDLE STATUS TRANSITIONS
    ------------------------------ */
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
        console.log("ℹ Unknown status:", status);
        break;
    }

    await subscription.save();
    await business.save();

    console.log("✅ Webhook processed successfully");

    /* -----------------------------
       6️⃣ ALWAYS RETURN 200
    ------------------------------ */
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("🔥 Webhook processing error:", error.message);

    // VERY IMPORTANT:
    // Always return 200 so IntaSend does not invalidate tokens
    return NextResponse.json({ received: true });
  }
}
