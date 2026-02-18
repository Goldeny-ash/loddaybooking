import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      businessId,
      email,
      firstName,
      lastName,
      reference,
      country,
      address,
      city,
      state,
      zipcode,
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
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

    // ✅ FIXED PATH
    if (business.access?.billing?.customerId) {
      return NextResponse.json({
        success: true,
        customerId: business.access.billing.customerId,
        existing: true,
      });
    }

    if (!email || !firstName || !lastName || !reference || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "https://api.intasend.com/api/v1/subscriptions-customers/",
      {
        email,
        first_name: firstName,
        last_name: lastName,
        reference,
        address,
        city,
        state,
        zipcode,
        country,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const customer = response.data;

    // ✅ FIXED NESTED SAVE
    business.access = business.access || {};
    business.access.billing = business.access.billing || {};
    business.access.billing.customerId = customer.customer_id;

    await business.save();

    return NextResponse.json({
      success: true,
      customerId: customer.customer_id,
      existing: false,
    });

  } catch (error: any) {
    console.error(
      "Ensure Customer Error:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      { error: "Failed to create subscription customer" },
      { status: 500 }
    );
  }
}
