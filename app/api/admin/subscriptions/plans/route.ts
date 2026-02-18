import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import { SubscriptionPlan } from "@/lib/models/SubscriptionPlan";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    /*
     * -----------------------
     * SANITIZE INPUT
     * -----------------------
     */

    const name = String(body.name || "").trim();
    const currency = String(body.currency || "").trim();
    const amount = Number(body.amount);
    const frequency = Number(body.frequency);
    const frequencyUnit = String(body.frequencyUnit || "").trim();
    const billingCycles =
      body.billingCycles === null || body.billingCycles === undefined
        ? null
        : Number(body.billingCycles);

    /*
     * -----------------------
     * VALIDATION
     * -----------------------
     */

    const allowedCurrencies = ["KES", "USD", "EUR", "GBP"];
    const allowedUnits = ["D", "W", "M", "Y"];

    if (!name) {
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
      (!Number.isInteger(billingCycles) || billingCycles <= 0)
    ) {
      return NextResponse.json(
        { error: "Billing cycles must be a positive integer or null" },
        { status: 400 }
      );
    }

    /*
     * -----------------------
     * CREATE PLAN IN INTASEND
     * -----------------------
     */

    const intasendResponse = await axios.post(
      "https://api.intasend.com/api/v1/subscriptions-plans/",
      {
        name,
        currency,
        amount: amount.toString(), // IntaSend expects string
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

    const providerPlan = intasendResponse.data;

    /*
     * -----------------------
     * DUPLICATE PROTECTION
     * -----------------------
     */

    const existing = await SubscriptionPlan.findOne({
      planId: providerPlan.plan_id,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Plan already exists locally" },
        { status: 400 }
      );
    }

    /*
     * -----------------------
     * STORE LOCALLY (STRICT TYPES)
     * -----------------------
     */

    const newPlan = await SubscriptionPlan.create({
      businessId: "GLOBAL",
      planId: String(providerPlan.plan_id),
      name: String(providerPlan.name),
      currency: String(providerPlan.currency),
      amount: Number(providerPlan.amount),
      frequency: Number(providerPlan.frequency),
      frequencyUnit: String(providerPlan.frequency_unit),
      billingCycles:
        providerPlan.billing_cycles !== null
          ? Number(providerPlan.billing_cycles)
          : null,
      providerCreatedAt: providerPlan.created_at
        ? new Date(providerPlan.created_at)
        : undefined,
      providerUpdatedAt: providerPlan.updated_at
        ? new Date(providerPlan.updated_at)
        : undefined,
      isActive: true, // 🔥 guaranteed Boolean
    });

    return NextResponse.json({
      success: true,
      plan: newPlan,
    });

  } catch (error: any) {
    console.error(
      "Create Plan Error:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}
