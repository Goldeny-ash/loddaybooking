import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateCommission from "@/lib/models/AffiliateCommission";
import AffiliateReferralUse from "@/lib/models/AffiliateReferralUse";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import type { Types } from "mongoose";

const FIRST_COMMISSION = 100;
const RENEWAL_COMMISSION = 150;

function addMonth(date: Date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

type SubscriptionDoc = {
  _id: Types.ObjectId;
  affiliateId?: Types.ObjectId;
  affiliateCode?: string;
  affiliateDiscountApplied?: boolean;
  affiliateCommissionAmount?: number;
  isRenewal?: boolean;
};

type BusinessDoc = {
  _id: Types.ObjectId;
};

async function creditAffiliateIfEligible(subscription: SubscriptionDoc, business: BusinessDoc) {
  if (!subscription.affiliateId || !subscription.affiliateCode) return;

  const affiliate = await Affiliate.findById(subscription.affiliateId);
  if (!affiliate) return;

  let referralUse = await AffiliateReferralUse.findOne({
    affiliateId: affiliate._id,
    businessId: business._id,
    referralCode: subscription.affiliateCode,
  });

  if (!referralUse && subscription.affiliateDiscountApplied) {
    referralUse = await AffiliateReferralUse.create({
      affiliateId: affiliate._id,
      businessId: business._id,
      referralCode: subscription.affiliateCode,
      usedAt: new Date(),
      expiresAt: affiliate.codeExpiresAt,
      firstSubscriptionCommissionPaid: false,
      renewalCount: 0,
    });
  }

  if (!referralUse) return;

  let commissionAmount = 0;
  let commissionType: "FIRST" | "RENEWAL" | null = null;

  if (!referralUse.firstSubscriptionCommissionPaid) {
    commissionAmount = FIRST_COMMISSION;
    commissionType = "FIRST";
    referralUse.firstSubscriptionCommissionPaid = true;
  } else {
    commissionAmount = RENEWAL_COMMISSION;
    commissionType = "RENEWAL";
    referralUse.renewalCount = (referralUse.renewalCount || 0) + 1;
  }

  if (!commissionType) return;

  await AffiliateCommission.create({
    affiliateId: affiliate._id,
    businessId: business._id,
    subscriptionId: subscription._id,
    amount: commissionAmount,
    currency: "KES",
    type: commissionType,
    status: "PENDING",
  });

  affiliate.totalEarned = (affiliate.totalEarned || 0) + commissionAmount;
  affiliate.availableBalance = (affiliate.availableBalance || 0) + commissionAmount;
  subscription.affiliateCommissionAmount = commissionAmount;

  await Promise.all([affiliate.save(), referralUse.save()]);
}

export async function GET() {
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
  }).sort({ createdAt: -1 });

  if (!subscription) {
    return NextResponse.json({ status: business?.access?.status || "INACTIVE" });
  }

  if (subscription.status === "ACTIVE") {
    if (subscription.affiliateId && !subscription.affiliateCommissionAmount) {
      await creditAffiliateIfEligible(subscription, business);
      await subscription.save();
    }
    return NextResponse.json({ status: "ACTIVE", subscription });
  }

  if (!subscription.invoiceId || !subscription.apiRef) {
    return NextResponse.json({ status: subscription.status, subscription });
  }

  const baseUrl =
    process.env.INTASEND_TEST === "true"
      ? "https://sandbox.intasend.com"
      : "https://api.intasend.com";

  try {
    const response = await fetch(`${baseUrl}/api/v1/payment/status/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_id: subscription.invoiceId,
        api_ref: subscription.apiRef,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ status: subscription.status, details: data });
    }

    const state = data?.invoice?.state;
    if (!state) {
      return NextResponse.json({ status: subscription.status });
    }

    if (state === "COMPLETE") {
      const now = new Date();
      subscription.status = "ACTIVE";
      subscription.paidAt = now;
      subscription.expiresAt = addMonth(now);
      subscription.nextChargeAt = addMonth(now);

      business.access.status = "ACTIVE";
      business.access.lastChargeAt = now;
      business.access.nextChargeAt = addMonth(now);
      business.access.subscriptionExpiresAt = addMonth(now);

      await creditAffiliateIfEligible(subscription, business);
      await Promise.all([subscription.save(), business.save()]);

      await dispatchEmailEvent(
        subscription.isRenewal ? "SUBSCRIPTION_RENEWED" : "SUBSCRIPTION_SUCCESS",
        { business }
      );

      return NextResponse.json({ status: "ACTIVE", subscription });
    }

    if (state === "FAILED" || state === "CANCELED") {
      subscription.status = "FAILED";
      await subscription.save();
      await dispatchEmailEvent("SUBSCRIPTION_FAILED", {
        business,
        retryUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/subscription`,
      });
      return NextResponse.json({ status: "FAILED", subscription });
    }

    return NextResponse.json({ status: subscription.status, subscription });
  } catch (error) {
    console.error("GET /api/subscription/status failed:", error);
    return NextResponse.json({ status: subscription.status, subscription });
  }
}
