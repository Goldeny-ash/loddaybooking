import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";
import {SubscriptionPlan} from "@/lib/models/SubscriptionPlan";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { businessId, planId, startDate, redirectUrl } = body;

    /*
     * -----------------------------
     * Validate Inputs
     * -----------------------------
     */
    if (!businessId || !planId || !startDate || !redirectUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (!business.billing?.customerId) {
      return NextResponse.json(
        { error: "Billing customer does not exist" },
        { status: 400 }
      );
    }

    /*
     * -----------------------------
     * Prevent duplicate ACTIVE subscription
     * -----------------------------
     */
    const activeSub = await Subscription.findOne({
      businessId,
      status: "ACTIVE",
    });

    if (activeSub) {
      return NextResponse.json(
        { error: "Business already has active subscription" },
        { status: 400 }
      );
    }

    /*
     * -----------------------------
     * Fetch Plan Snapshot
     * -----------------------------
     */
    const plan = await SubscriptionPlan.findOne({ planId });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    /*
     * -----------------------------
     * Call IntaSend Create Subscription
     * -----------------------------
     */
    const response = await axios.post(
      "https://api.intasend.com/api/v1/subscriptions/",
      {
        customer_id: business.billing.customerId,
        plan_id: plan.planId,
        reference: `LOD-${business._id}-${Date.now()}`,
        start_date: startDate,
        redirect_url: redirectUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    /*
     * -----------------------------
     * Save Subscription Locally
     * -----------------------------
     */
    const subscription = await Subscription.create({
      businessId,
      subscriptionId: data.subscription_id,
      planId: plan.planId,
      customerId: business.billing.customerId,
      externalReference: data.reference,
      status: "PENDING",
      setupUrl: data.setup_url,
      currency: plan.currency,
      amount: plan.amount,
      frequency: plan.frequency,
      frequencyUnit: plan.frequencyUnit,
      billingCycles: plan.billingCycles,
      startsAt: startDate,
      providerCreatedAt: data.created_at,
      providerUpdatedAt: data.updated_at,
    });

    return NextResponse.json({
      success: true,
      setupUrl: data.setup_url,
      subscriptionId: subscription.subscriptionId,
    });

  } catch (error: any) {
    console.error(
      "Create Subscription Error:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
