import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import {SubscriptionPlan} from "@/lib/models/SubscriptionPlan";

export async function PUT(
  req: Request,
  { params }: { params: { planId: string } }
) {
  try {
    await connectDB();

    const { name, amount, frequency, frequencyUnit, billingCycles } =
      await req.json();

    const plan = await SubscriptionPlan.findOne({
      planId: params.planId,
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    /*
     * Update in IntaSend
     */
    await axios.put(
      `https://api.intasend.com/api/v1/subscriptions-plans/${params.planId}/`,
      {
        name,
        amount,
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

    /*
     * Update Locally
     */
    plan.name = name;
    plan.amount = amount;
    plan.frequency = frequency;
    plan.frequencyUnit = frequencyUnit;
    plan.billingCycles = billingCycles;

    await plan.save();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Update Plan Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: { planId: string } }
) {
  await connectDB();

  const plan = await SubscriptionPlan.findOne({
    planId: params.planId,
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  plan.isActive = false;
  await plan.save();

  return NextResponse.json({ success: true });
}
