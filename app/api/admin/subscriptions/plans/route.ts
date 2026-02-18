import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import {SubscriptionPlan} from "@/lib/models/SubscriptionPlan";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      name,
      currency,
      amount,
      frequency,
      frequencyUnit,
      billingCycles,
    } = body;

    /*
     * -----------------------
     * VALIDATION
     * -----------------------
     */

    const allowedCurrencies = ["KES", "USD", "EUR", "GBP"];
    const allowedUnits = ["D", "W", "M", "Y"];

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid plan name" },
        { status: 400 }
      );
    }

    if (!allowedCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: "Invalid currency" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(frequency) || frequency <= 0) {
      return NextResponse.json(
        { error: "Frequency must be a positive integer" },
        { status: 400 }
      );
    }

    if (!allowedUnits.includes(frequencyUnit)) {
      return NextResponse.json(
        { error: "Invalid frequency unit" },
        { status: 400 }
      );
    }

    if (
      billingCycles !== null &&
      billingCycles !== undefined &&
      (!Number.isInteger(billingCycles) || billingCycles <= 0)
    ) {
      return NextResponse.json(
        { error: "Billing cycles must be a positive integer or null" },
        { status: 400 }
      );
    }

    /*
     * -----------------------
     * CALL INTASEND
     * -----------------------
     */

    const intasendResponse = await axios.post(
      "https://api.intasend.com/api/v1/subscriptions-plans/",
      {
        name,
        currency,
        amount: amount.toString(),
        frequency,
        frequency_unit: frequencyUnit,
        billing_cycles: billingCycles,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const plan = intasendResponse.data;

    /*
     * -----------------------
     * STORE IN DB
     * -----------------------
     */

    const newPlan = await SubscriptionPlan.create({
      businessId: "GLOBAL", // or admin-level scope
      planId: plan.plan_id,
      name: plan.name,
      currency: plan.currency,
      amount: parseFloat(plan.amount),
      frequency: plan.frequency,
      frequencyUnit: plan.frequency_unit,
      billingCycles: plan.billing_cycles ?? null,
      providerCreatedAt: plan.created_at,
      providerUpdatedAt: plan.updated_at,
    });

    return NextResponse.json({
      success: true,
      plan: newPlan,
    });
  } catch (error: any) {
    console.error("Create Plan Error:", error.response?.data || error.message);

    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });

    return NextResponse.json(plans);

  } catch (error: any) {
    console.error("Fetch Plans Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}