// app/api/business/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import mongoose from "mongoose";
import Business from "@/lib/models/Business";
import { auth } from "@clerk/nextjs/server";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    }

    await connectDB();

    const body = await req.json();
    const existingBusiness = await Business.findById(id);
    if (!existingBusiness) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (existingBusiness.clerkUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (typeof body.username === "string") {
      body.username = body.username.toLowerCase().replace(/\s+/g, "-").trim();
      const usernameTaken = await Business.findOne({
        username: body.username,
        _id: { $ne: id },
      });
      if (usernameTaken) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
    }

    if (typeof body.email === "string") {
      body.email = body.email.trim().toLowerCase();
      if (body.email) {
        const emailTaken = await Business.findOne({
          email: { $regex: `^${escapeRegex(body.email)}$`, $options: "i" },
          _id: { $ne: id },
        });
        if (emailTaken) {
          return NextResponse.json({ error: "Business email already in use" }, { status: 409 });
        }
      }
    }

    if (body.location) {
      body.location = {
        ...body.location,
        county: String(body.location.county || "").trim(),
        subCounty: String(body.location.subCounty || "").trim(),
        ward: String(body.location.ward || "").trim(),
        area: String(body.location.area || "").trim(),
        locationDescription: String(body.location.locationDescription || "").trim(),
        mapsLink: String(body.location.mapsLink || "").trim(),
      };
    }

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
