import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Subscription from "@/lib/models/Subscription";
import { currentUser } from "@clerk/nextjs/server";

const PLAN_ID = "EY9EBY5"; // KES 600 monthly

export async function POST() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const business = await Business.findOne({
      clerkUserId: user.id,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    /*
     * -------------------------------
     * 1️⃣ Ensure IntaSend Customer
     * -------------------------------
     */

    let customerId = business.access?.billing?.customerId;

    if (!customerId) {
      const customerRes = await axios.post(
        "https://api.intasend.com/api/v1/subscriptions-customers/",
        {
          email: business.email,
          first_name: business.name,
          last_name: "",
          reference: business._id.toString(),
          country: "KE",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      customerId = customerRes.data.customer_id;

      business.access.billing.customerId = customerId;
      await business.save();
    }

    /*
     * -------------------------------
     * 2️⃣ Create Subscription
     * -------------------------------
     */

    const subRes = await axios.post(
      "https://api.intasend.com/api/v1/subscriptions/",
      {
        customer_id: customerId,
        plan_id: PLAN_ID,
        reference: business._id.toString(),
        start_date: new Date().toISOString().split("T")[0],
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const {
      subscription_id,
      setup_url,
      status,
    } = subRes.data;

    /*
     * -------------------------------
     * 3️⃣ Save Locally
     * -------------------------------
     */

    await Subscription.create({
      businessId: business._id,
      subscriptionId: subscription_id,
      planId: PLAN_ID,
      status: status || "PENDING",
    });

    business.access.subscriptionId = subscription_id;
    business.access.planId = PLAN_ID;
    business.access.status = "INACTIVE"; // until webhook confirms
    await business.save();

    return NextResponse.json({ setup_url });

  } catch (error: any) {
    console.error("Start subscription error:", error.message);
    return NextResponse.json(
      { error: "Subscription start failed" },
      { status: 500 }
    );
  }
}
