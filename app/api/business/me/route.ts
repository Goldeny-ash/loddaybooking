import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const business = await Business.findOne({
    clerkUserId: userId,
  });

  if (!business) {
    return NextResponse.json({ business: null });
  }

  const servicesCount = await Service.countDocuments({
    businessId: business._id,
  });

  return NextResponse.json({
    business: {
      ...business.toObject(),
      setupStep: business.setupStep || 1,
      servicesCount,
    },
  });
}
