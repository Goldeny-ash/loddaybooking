import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";
import Business from "@/lib/models/Business";

function addMonth(date: Date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

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

    const payload = JSON.parse(rawBody || "{}");
    const invoiceId = payload?.invoice_id || payload?.invoice?.invoice_id;
    const apiRef = payload?.api_ref || payload?.invoice?.api_ref;
    const state = payload?.state || payload?.invoice?.state || payload?.status;

    if (!invoiceId && !apiRef) {
      return NextResponse.json({ received: true });
    }

    await connectDB();

    const subscription = await Subscription.findOne({
      $or: [{ invoiceId }, { apiRef }],
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json({ received: true });
    }

    const business = await Business.findById(subscription.businessId);
    if (!business) {
      return NextResponse.json({ received: true });
    }

    if (state === "COMPLETE") {
      const now = new Date();
      subscription.status = "ACTIVE";
      subscription.paidAt = now;
      subscription.expiresAt = addMonth(now);
      subscription.nextChargeAt = addMonth(now);
      await subscription.save();

      business.access.status = "ACTIVE";
      business.access.lastChargeAt = now;
      business.access.nextChargeAt = addMonth(now);
      business.access.subscriptionExpiresAt = addMonth(now);
      await business.save();
    } else if (state === "FAILED" || state === "CANCELED") {
      subscription.status = "FAILED";
      await subscription.save();
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("IntaSend webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
