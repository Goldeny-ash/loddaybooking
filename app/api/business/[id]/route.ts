// app/api/business/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import mongoose from "mongoose";
import Business from "@/lib/models/Business";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // match promise style
) {
  try {
    const { id } = await params; // await the promise
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    }

    await connectDB();

    const business = await Business.findById(id).lean();
    if (!business)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });

    return NextResponse.json({ ...business, _id: business._id.toString() });
  } catch (err: any) {
    console.error("GET business error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // same promise style
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    }

    await connectDB();

    const body = await req.json();

    // ---------------- SANITIZE NESTED FIELDS ----------------
    if (body.bookingRules) {
      body.bookingRules.autoApprove = Boolean(body.bookingRules.autoApprove);
      body.bookingRules.bufferMinutes = Number(body.bookingRules.bufferMinutes) || 0;
    }

    if (body.depositPolicy) {
      body.depositPolicy.enabled = Boolean(body.depositPolicy.enabled);
      body.depositPolicy.applyToCallout = Boolean(body.depositPolicy.applyToCallout);
      body.depositPolicy.value = Number(body.depositPolicy.value) || 0;
    }

    if (body.mobileSettings) {
      body.mobileSettings.enabled = Boolean(body.mobileSettings.enabled);

      if (body.mobileSettings.baseLocation) {
        body.mobileSettings.baseLocation.lat =
          Number(body.mobileSettings.baseLocation.lat) || 0;
        body.mobileSettings.baseLocation.lng =
          Number(body.mobileSettings.baseLocation.lng) || 0;
      }

      if (body.mobileSettings.calloutPolicy) {
        const cp = body.mobileSettings.calloutPolicy;
        cp.baseFee = Number(cp.baseFee) || 0;
        cp.perKmFee = Number(cp.perKmFee) || 0;
        if (Array.isArray(cp.zones)) {
            cp.zones = cp.zones.map((z: { name?: string; radiusKm?: number; fee?: number }) => ({
            name: z.name || "",
            radiusKm: Number(z.radiusKm) || 0,
            fee: Number(z.fee) || 0,
            }));
        }
      }

      body.mobileSettings.maxDistanceKm =
        Number(body.mobileSettings.maxDistanceKm) || 0;
    }

    const updatedBusiness = await Business.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedBusiness)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });

    return NextResponse.json({ ...updatedBusiness, _id: updatedBusiness._id.toString() });
  } catch (err: any) {
    console.error("PATCH business error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
