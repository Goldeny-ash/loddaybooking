import { connectDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Service from "@/lib/models/Service";
import { validateServicePayload } from "@/lib/validators/serviceValidation";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";

export async function POST(req: Request) {
  await connectDB();
  const business = await getCurrentBusiness();

  const body = await req.json();

  try {
    const validated = await validateServicePayload({
      ...body,
      businessId: business._id,
    });

    const service = await Service.create(validated);

    return NextResponse.json({ success: true, service });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

export async function GET() {
  await connectDB();
  const business = await getCurrentBusiness();

  const services = await Service.find({ businessId: business._id })
    .populate({
      path: "promotions",
      select: "_id title type value", // explicitly select required fields including _id
    })
    .sort({ createdAt: -1 });

  return NextResponse.json({ success: true, services });
}

