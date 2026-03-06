import { connectDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import Promotion from "@/lib/models/Promotion";
import {
  validateServicePayload,
  SERVICE_UPDATE_FIELDS,
} from "@/lib/validators/serviceValidation";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;

  await connectDB();
  const business = await getCurrentBusiness();

  const service = await Service.findOne({
    _id: serviceId,
    businessId: business._id,
  }).populate("promotions");

  if (!service)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, service });
}

// ---------- UPDATE ----------

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;

  await connectDB();
  const business = await getCurrentBusiness();

  const body = await req.json();

  const updates: any = {};

  for (const field of SERVICE_UPDATE_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  try {
    const validated = await validateServicePayload(updates);

    const updated = await Service.findOneAndUpdate(
      { _id: serviceId, businessId: business._id },
      validated,
      { new: true }
    ).populate("promotions");

    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (updated.depositOverride?.enabled) {
      await Business.findByIdAndUpdate(business._id, {
        "depositPolicy.enabled": true,
      });
    }

    return NextResponse.json({ success: true, service: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

// ---------- DELETE ----------

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;

  await connectDB();
  const business = await getCurrentBusiness();

  const service = await Service.findOneAndDelete({
    _id: serviceId,
    businessId: business._id,
  });

  if (!service)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Promotion.updateMany(
    { services: service._id },
    { $pull: { services: service._id } }
  );

  return NextResponse.json({ success: true });
}
