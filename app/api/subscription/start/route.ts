import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";
import { SubscriptionPlan } from "@/lib/models/SubscriptionPlan";
import { currentUser } from "@clerk/nextjs/server";
import { createCustomer, createSubscription } from "@/lib/intasend";

function normalizeKePhone(input: string) {
  const cleaned = (input || "").trim().replace(/\s+/g, "").replace("+", "");
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith("254")) return cleaned;
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentMethod = String(body?.paymentMethod || "subscription").toLowerCase();
    const providedPhone = body?.phoneNumber ? String(body.phoneNumber) : "";

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const business = await Business.findOne({ clerkUserId: user.id });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const existingActive = await Subscription.findOne({
      businessId: business._id.toString(),
      status: "ACTIVE",
    });
    if (existingActive) {
      return NextResponse.json(
        { error: "Business already has an active subscription" },
        { status: 400 }
      );
    }

    const plan =
      (await SubscriptionPlan.findOne({ isActive: true }).sort({ createdAt: -1 })) ||
      (process.env.INTASEND_DEFAULT_PLAN_ID
        ? await SubscriptionPlan.findOne({ planId: process.env.INTASEND_DEFAULT_PLAN_ID })
        : null);

    if (!plan) {
      return NextResponse.json({ error: "No active subscription plan found" }, { status: 404 });
    }

    if (!business.access) business.access = { status: "TRIAL" };
    if (!business.access.billing) business.access.billing = {};

    let customerId = business.access.billing.customerId;
    if (!customerId) {
      const customer = await createCustomer({
        email: business.email || "billing@lodday.com",
        firstName: business.name || "Business",
        lastName: "",
        reference: `BUS-${business._id}`,
        country: "KE",
      });

      customerId = customer.customer_id;
      business.access.billing.customerId = customerId;
      await business.save();
    }

    if (paymentMethod === "mpesa") {
      const phone = normalizeKePhone(providedPhone || business.phone || "");
      if (!phone) {
        return NextResponse.json(
          { error: "Valid M-Pesa phone number is required" },
          { status: 400 }
        );
      }

      const baseUrl =
        process.env.INTASEND_TEST === "true"
          ? "https://sandbox.intasend.com"
          : "https://api.intasend.com";

      const mpesaRes = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: business.name || "Business",
          last_name: "Subscription",
          email: business.email || "billing@lodday.com",
          host: process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin,
          amount: plan.amount,
          phone_number: phone,
          api_ref: `SUB-${business._id}-${Date.now()}`,
        }),
      });

      const mpesaData = await mpesaRes.json();
      if (!mpesaRes.ok) {
        return NextResponse.json(
          { error: "M-Pesa payment initiation failed", details: mpesaData },
          { status: mpesaRes.status || 500 }
        );
      }

      return NextResponse.json({
        success: true,
        paymentMethod: "mpesa",
        message: "M-Pesa STK push sent. Complete payment on your phone.",
        invoiceId: mpesaData?.invoice?.invoice_id || null,
        state: mpesaData?.invoice?.state || null,
      });
    }

    const providerSub = await createSubscription({
      customerId,
      planId: plan.planId,
      reference: `SUB-${business._id}`,
      startDate: new Date().toISOString().split("T")[0],
      redirectUrl: `${request.nextUrl.origin}/subscription/success`,
    });

    const startsAt = providerSub.start_date ? new Date(providerSub.start_date) : undefined;
    const providerCreatedAt = providerSub.created_at ? new Date(providerSub.created_at) : undefined;
    const providerUpdatedAt = providerSub.updated_at ? new Date(providerSub.updated_at) : undefined;

    await Subscription.create({
      businessId: business._id.toString(),
      subscriptionId: providerSub.subscription_id,
      customerId,
      planId: plan.planId,
      externalReference: `SUB-${business._id}`,
      currency: plan.currency,
      amount: plan.amount,
      frequency: plan.frequency,
      frequencyUnit: plan.frequencyUnit,
      billingCycles: plan.billingCycles ?? null,
      status: providerSub.status || "PENDING",
      setupUrl: providerSub.setup_url,
      startsAt,
      providerCreatedAt,
      providerUpdatedAt,
    });

    business.access.subscriptionId = providerSub.subscription_id;
    business.access.planId = plan.planId;
    business.access.status = "INACTIVE";
    await business.save();

    return NextResponse.json({ setup_url: providerSub.setup_url });
  } catch (error: any) {
    const providerData = error?.response?.data || null;
    const providerStatus = error?.response?.status;
    console.error("Subscription start failed:", {
      message: error?.message,
      status: providerStatus,
      data: providerData,
    });
    return NextResponse.json(
      {
        error: "Subscription start failed",
        details: providerData?.errors || providerData?.detail || providerData?.message || null,
      },
      { status: providerStatus && providerStatus >= 400 ? providerStatus : 500 }
    );
  }
}
