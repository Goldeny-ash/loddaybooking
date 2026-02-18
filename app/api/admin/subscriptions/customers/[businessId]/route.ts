import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export async function POST(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const businessId = url.pathname.split("/").pop();

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID missing" },
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

    if (business.access?.billing?.customerId) {
      return NextResponse.json({
        message: "Customer already exists",
        customerId: business.access.billing.customerId,
      });
    }

    if (!business.email || !business.name) {
      return NextResponse.json(
        { error: "Business missing required details" },
        { status: 400 }
      );
    }

    const reference = `BUS-${business._id}`;

    const response = await axios.post(
      "https://api.intasend.com/api/v1/subscriptions-customers/",
      {
        email: business.email,
        first_name: business.name,
        last_name: "",
        reference,
        country: "KE",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    business.access.billing.customerId = data.customer_id;
    await business.save();

    return NextResponse.json({
      customerId: data.customer_id,
    });

  } catch (error: any) {
    console.error(error.response?.data || error.message);

    return NextResponse.json(
      { error: "Failed to create IntaSend customer" },
      { status: 500 }
    );
  }
}
