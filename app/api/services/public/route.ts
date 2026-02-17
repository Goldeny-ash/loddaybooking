import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import Service from "@/lib/models/Service";

export async function GET(req: Request) {
  const business = await getCurrentBusiness({
    requireSetup: true,
  });

  if (!business)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );

  await connectDB();

  const { searchParams } = new URL(req.url);

  const query = searchParams.get("q");
  const hidden = searchParams.get("hidden");
  const bundle = searchParams.get("bundle");
  const deposit = searchParams.get("deposit");
  const mobile = searchParams.get("mobile");

  const sort = searchParams.get("sort") || "-createdAt";

  const filter: any = {
    businessId: business._id,
    archivedAt: { $exists: false },
  };

  if (query)
    filter.name = {
      $regex: query,
      $options: "i",
    };

  if (hidden === "true") filter.hidden = true;
  if (bundle === "true") filter.isBundle = true;
  if (deposit === "true")
    filter["depositOverride.enabled"] = true;
  if (mobile === "true") filter.mobileEligible = true;

  const services = await Service.find(filter)
    .sort(sort)
    .lean();

  return NextResponse.json({ services });
}
