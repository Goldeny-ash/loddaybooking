import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export async function GET() {
  await connectDB();

  const businesses = await Business.find()
    .select("name email access.status access.billing.customerId")
    .lean();

  return NextResponse.json(businesses);
}
