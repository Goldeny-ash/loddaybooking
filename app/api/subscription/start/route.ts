import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";
import { SubscriptionPlan } from "@/lib/models/SubscriptionPlan";
import { currentUser } from "@clerk/nextjs/server";
import { createCustomer, createSubscription } from "@/lib/intasend";

const PLAN_ID = "NKBOWY4";

export async function POST(request: NextRequest) {
  console.log("🔵 [START] Subscription start triggered");

  try {
    /* -------------------------------
       1️⃣ AUTH
    -------------------------------- */
    const user = await currentUser();
    console.log("🟡 Clerk user:", user?.id);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* -------------------------------
       2️⃣ DB
    -------------------------------- */
    await connectDB();
    console.log("🟢 DB connected");

    const business = await Business.findOne({
      clerkUserId: user.id,
    });

    if (!business) {
      console.log("🔴 Business not found");
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    console.log("🟢 Business ID:", business._id.toString());

    /* -------------------------------
       3️⃣ PREVENT DUPLICATE ACTIVE
    -------------------------------- */
    const existingActive = await Subscription.findOne({
      businessId: business._id.toString(),
      status: "ACTIVE",
    });

    if (existingActive) {
      console.log("🔴 Active subscription already exists");
      return NextResponse.json(
        { error: "Business already has an active subscription" },
        { status: 400 }
      );
    }

    /* -------------------------------
       4️⃣ FETCH PLAN SNAPSHOT
    -------------------------------- */
    const plan = await SubscriptionPlan.findOne({
      planId: PLAN_ID,
      isActive: true,
    });

    if (!plan) {
      console.log("🔴 Plan not found or inactive");
      return NextResponse.json(
        { error: "Subscription plan not found or inactive" },
        { status: 404 }
      );
    }

    console.log("🟢 Plan loaded:", PLAN_ID);

    /* -------------------------------
       5️⃣ ENSURE CUSTOMER
    -------------------------------- */
    let customerId = business.access?.billing?.customerId;

    if (!customerId) {
      console.log("🟡 Creating IntaSend customer...");

      const customer = await createCustomer({
        email: business.email,
        firstName: business.name,
        lastName: "",
        reference: `BUS-${business._id}`,
        country: "KE",
      });

      customerId = customer.customer_id;

      business.access = business.access || {};
      business.access.billing = business.access.billing || {};
      business.access.billing.customerId = customerId;

      await business.save();

      console.log("🟢 Customer saved:", customerId);
    } else {
      console.log("🟢 Using existing customer:", customerId);
    }

    /* -------------------------------
       6️⃣ CREATE PROVIDER SUBSCRIPTION
    -------------------------------- */
    console.log("🟡 Creating provider subscription...");

    const providerSub = await createSubscription({
      customerId,
      planId: PLAN_ID,
      reference: `SUB-${business._id}`,
      startDate: new Date().toISOString().split("T")[0],
      redirectUrl: `${request.nextUrl.origin}/subscription/success`,
    });

    console.log("🟢 Provider response:", providerSub);

    /* -------------------------------
       7️⃣ SAFE DATE PARSING
    -------------------------------- */

    let startsAt: Date | undefined;
    let providerCreatedAt: Date | undefined;
    let providerUpdatedAt: Date | undefined;

    if (providerSub.start_date) {
      const parsed = new Date(providerSub.start_date);
      if (!isNaN(parsed.getTime())) {
        startsAt = parsed;
      } else {
        console.log("⚠ Invalid start_date:", providerSub.start_date);
      }
    }

    if (providerSub.created_at) {
      const parsed = new Date(providerSub.created_at);
      if (!isNaN(parsed.getTime())) {
        providerCreatedAt = parsed;
      }
    }

    if (providerSub.updated_at) {
      const parsed = new Date(providerSub.updated_at);
      if (!isNaN(parsed.getTime())) {
        providerUpdatedAt = parsed;
      }
    }

    /* -------------------------------
       8️⃣ SAVE SUBSCRIPTION LOCALLY
    -------------------------------- */
    await Subscription.create({
      businessId: business._id.toString(),
      subscriptionId: providerSub.subscription_id,
      customerId,
      planId: PLAN_ID,
      externalReference: `SUB-${business._id}`,

      // Billing snapshot
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

    console.log("🟢 Subscription saved");

    /* -------------------------------
       9️⃣ UPDATE BUSINESS ACCESS
    -------------------------------- */
    business.access.subscriptionId = providerSub.subscription_id;
    business.access.planId = PLAN_ID;
    business.access.status = "INACTIVE";

    await business.save();

    console.log("🟢 Business updated");

    /* -------------------------------
       🔟 RETURN SETUP URL
    -------------------------------- */
    return NextResponse.json({
      setup_url: providerSub.setup_url,
    });

  } catch (error: any) {
    console.error("🔴 Subscription start failed");

    if (error.response) {
      console.error("Provider status:", error.response.status);
      console.error("Provider data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }

    return NextResponse.json(
      { error: "Subscription start failed" },
      { status: 500 }
    );
  }
}
