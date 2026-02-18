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

    /*
     * -----------------------------
     * Validate Business ID
     * -----------------------------
     */
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

    /*
     * -----------------------------
     * If Customer Already Exists
     * -----------------------------
     */
    if (business.billing?.customerId) {
      return NextResponse.json({
        success: true,
        customerId: business.billing.customerId,
        existing: true,
      });
    }

    /*
     * -----------------------------
     * Validate Required Fields
     * -----------------------------
     */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First and last name are required" },
        { status: 400 }
      );
    }

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    if (!country || country.length !== 2) {
      return NextResponse.json(
        { error: "Country must be a 2-letter ISO code" },
        { status: 400 }
      );
    }

    /*
     * -----------------------------
     * Create Customer in IntaSend
     * -----------------------------
     */

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

    /*
     * -----------------------------
     * Persist customer_id Locally
     * -----------------------------
     */

    business.billing = {
      ...business.billing,
      customerId: customer.customer_id,
    };

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
