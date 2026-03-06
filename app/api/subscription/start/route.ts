import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";
import Affiliate from "@/lib/models/Affiliate";
import AffiliateReferralUse from "@/lib/models/AffiliateReferralUse";
import type { Types } from "mongoose";

const SUBSCRIPTION_AMOUNT = 600;
const AFFILIATE_DISCOUNT = 50;

function normalizePhone(raw: string) {
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  return cleaned.replace("+", "");
}

type AffiliateDoc = {
  _id: Types.ObjectId;
  referralCode?: string;
};

type ReferralUseDoc = {
  _id: Types.ObjectId;
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const user = await currentUser();
    await connectDB();

    const business = await Business.findOne({ clerkUserId: userId });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const phoneInput = String(
      body.phoneNumber || business.phone || user?.phoneNumbers?.[0]?.phoneNumber || ""
    );
    const affiliateCode = String(body.affiliateCode || "").trim().toUpperCase();

    if (!phoneInput) {
      return NextResponse.json(
        { error: "Phone number is required for STK push" },
        { status: 400 }
      );
    }

    const phoneNumber = normalizePhone(phoneInput);
    const now = new Date();
    const isRenewal = business.access?.status === "ACTIVE";

    let finalAmount = SUBSCRIPTION_AMOUNT;
    let affiliateDoc: AffiliateDoc | null = null;
    let referralUse: ReferralUseDoc | null = null;
    let discountApplied = false;

    if (affiliateCode) {
      affiliateDoc = await Affiliate.findOne({
        referralCode: affiliateCode,
        status: "ACTIVE",
        codeExpiresAt: { $gt: now },
      });

      if (affiliateDoc) {
        referralUse = await AffiliateReferralUse.findOne({
          affiliateId: affiliateDoc._id,
          businessId: business._id,
          referralCode: affiliateCode,
        });

        if (!referralUse) {
          finalAmount = SUBSCRIPTION_AMOUNT - AFFILIATE_DISCOUNT;
          discountApplied = true;
        }
      }
    } else {
      const existingReferral = await AffiliateReferralUse.findOne({
        businessId: business._id,
      }).sort({ createdAt: -1 });

      if (existingReferral) {
        affiliateDoc = await Affiliate.findById(existingReferral.affiliateId);
      }
    }

    const externalReference = `SUB-${business._id}-${Date.now()}`;
    const baseUrl =
      process.env.INTASEND_TEST === "true"
        ? "https://sandbox.intasend.com"
        : "https://api.intasend.com";

    const response = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: business.name || "Business",
        last_name: "Subscription",
        email: business.email || user?.primaryEmailAddress?.emailAddress || "billing@lodday.com",
        host: process.env.NEXT_PUBLIC_APP_URL,
        amount: finalAmount,
        phone_number: phoneNumber,
        api_ref: externalReference,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: "IntaSend STK initiation failed", details: data },
        { status: 502 }
      );
    }

    const invoiceId = data?.invoice?.invoice_id || null;
    await Subscription.create({
      businessId: business._id.toString(),
      externalReference,
      apiRef: externalReference,
      invoiceId,
      amount: finalAmount,
      currency: "KES",
      status: "PENDING",
      phoneNumber,
      isRenewal,
      affiliateCode:
        affiliateDoc && affiliateCode
          ? affiliateCode
          : affiliateDoc
            ? String(affiliateDoc.referralCode || "")
            : undefined,
      affiliateId: affiliateDoc?._id,
      affiliateDiscountApplied: discountApplied,
    });

    return NextResponse.json({
      success: true,
      amount: finalAmount,
      reference: externalReference,
      invoiceId,
      affiliateDiscountApplied: discountApplied,
    });
  } catch (error) {
    console.error("POST /api/subscription/start failed:", error);
    return NextResponse.json({ error: "Failed to start subscription" }, { status: 500 });
  }
}
