// app/api/business/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import mongoose from "mongoose";
import Business from "@/lib/models/Business";
import { auth } from "@clerk/nextjs/server";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toTrimmedString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const pickTrimmedString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const pickNumberOrZero = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNumberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

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

    const nextLocation = {
      ...(existingBusiness.location?.toObject?.() ?? existingBusiness.location ?? {}),
      ...(body.location ?? {}),
      county: pickTrimmedString(body.location?.county, existingBusiness.location?.county ?? ""),
      subCounty: pickTrimmedString(body.location?.subCounty, existingBusiness.location?.subCounty ?? ""),
      ward: pickTrimmedString(body.location?.ward, existingBusiness.location?.ward ?? ""),
      area: pickTrimmedString(body.location?.area, existingBusiness.location?.area ?? ""),
      locationDescription: pickTrimmedString(
        body.location?.locationDescription,
        existingBusiness.location?.locationDescription ?? ""
      ),
      mapsLink: pickTrimmedString(body.location?.mapsLink, existingBusiness.location?.mapsLink ?? ""),
      lat: pickNumberOrZero(body.location?.lat, existingBusiness.location?.lat ?? 0),
      lng: pickNumberOrZero(body.location?.lng, existingBusiness.location?.lng ?? 0),
    };

    const nextTheme = {
      ...(existingBusiness.theme?.toObject?.() ?? existingBusiness.theme ?? {}),
      ...(body.theme ?? {}),
      primary: pickTrimmedString(body.theme?.primary, existingBusiness.theme?.primary ?? ""),
      accent: pickTrimmedString(body.theme?.accent, existingBusiness.theme?.accent ?? ""),
    };

    const nextSocialLinks = {
      ...(existingBusiness.socialLinks?.toObject?.() ?? existingBusiness.socialLinks ?? {}),
      ...(body.socialLinks ?? {}),
      facebook: pickTrimmedString(body.socialLinks?.facebook, existingBusiness.socialLinks?.facebook ?? ""),
      instagram: pickTrimmedString(body.socialLinks?.instagram, existingBusiness.socialLinks?.instagram ?? ""),
      twitter: pickTrimmedString(body.socialLinks?.twitter, existingBusiness.socialLinks?.twitter ?? ""),
      tiktok: pickTrimmedString(body.socialLinks?.tiktok, existingBusiness.socialLinks?.tiktok ?? ""),
    };

    const nextBookingRules = {
      ...(existingBusiness.bookingRules?.toObject?.() ?? existingBusiness.bookingRules ?? {}),
      ...(body.bookingRules ?? {}),
      autoApprove:
        body.bookingRules?.autoApprove === undefined
          ? Boolean(existingBusiness.bookingRules?.autoApprove)
          : Boolean(body.bookingRules.autoApprove),
      bufferMinutes: pickNumberOrZero(
        body.bookingRules?.bufferMinutes,
        existingBusiness.bookingRules?.bufferMinutes ?? 0
      ),
    };

    const nextDepositPolicy = {
      ...(existingBusiness.depositPolicy?.toObject?.() ?? existingBusiness.depositPolicy ?? {}),
      ...(body.depositPolicy ?? {}),
      enabled:
        body.depositPolicy?.enabled === undefined
          ? Boolean(existingBusiness.depositPolicy?.enabled)
          : Boolean(body.depositPolicy.enabled),
      type:
        body.depositPolicy?.type === undefined
          ? existingBusiness.depositPolicy?.type ?? "fixed"
          : body.depositPolicy.type === "percent"
            ? "percent"
            : "fixed",
      value: pickNumberOrZero(body.depositPolicy?.value, existingBusiness.depositPolicy?.value ?? 0),
      applyToCallout:
        body.depositPolicy?.applyToCallout === undefined
          ? Boolean(existingBusiness.depositPolicy?.applyToCallout)
          : Boolean(body.depositPolicy.applyToCallout),
    };

    const nextMobileSettings = {
      ...(existingBusiness.mobileSettings?.toObject?.() ?? existingBusiness.mobileSettings ?? {}),
      ...(body.mobileSettings ?? {}),
      enabled:
        body.mobileSettings?.enabled === undefined
          ? Boolean(existingBusiness.mobileSettings?.enabled)
          : Boolean(body.mobileSettings.enabled),
      baseLocation: {
        ...(existingBusiness.mobileSettings?.baseLocation?.toObject?.() ??
          existingBusiness.mobileSettings?.baseLocation ??
          {}),
        ...(body.mobileSettings?.baseLocation ?? {}),
        lat: pickNumberOrZero(
          body.mobileSettings?.baseLocation?.lat,
          existingBusiness.mobileSettings?.baseLocation?.lat ?? 0
        ),
        lng: pickNumberOrZero(
          body.mobileSettings?.baseLocation?.lng,
          existingBusiness.mobileSettings?.baseLocation?.lng ?? 0
        ),
        address: pickTrimmedString(
          body.mobileSettings?.baseLocation?.address,
          existingBusiness.mobileSettings?.baseLocation?.address ?? ""
        ),
      },
      calloutPolicy: {
        ...(existingBusiness.mobileSettings?.calloutPolicy?.toObject?.() ??
          existingBusiness.mobileSettings?.calloutPolicy ??
          {}),
        ...(body.mobileSettings?.calloutPolicy ?? {}),
        type:
          body.mobileSettings?.calloutPolicy?.type === undefined
            ? existingBusiness.mobileSettings?.calloutPolicy?.type ?? "fixed"
            : body.mobileSettings.calloutPolicy.type === "per_km"
              ? "per_km"
              : "fixed",
        baseFee: pickNumberOrZero(
          body.mobileSettings?.calloutPolicy?.baseFee,
          existingBusiness.mobileSettings?.calloutPolicy?.baseFee ?? 0
        ),
        perKmFee: pickNumberOrZero(
          body.mobileSettings?.calloutPolicy?.perKmFee,
          existingBusiness.mobileSettings?.calloutPolicy?.perKmFee ?? 0
        ),
        zones: Array.isArray(body.mobileSettings?.calloutPolicy?.zones)
          ? body.mobileSettings.calloutPolicy.zones.map(
              (z: { name?: string; radiusKm?: number; fee?: number }) => ({
                name: toTrimmedString(z?.name),
                radiusKm: toNumberOrZero(z?.radiusKm),
                fee: toNumberOrZero(z?.fee),
              })
            )
          : existingBusiness.mobileSettings?.calloutPolicy?.zones ?? [],
      },
      maxDistanceKm: pickNumberOrZero(
        body.mobileSettings?.maxDistanceKm,
        existingBusiness.mobileSettings?.maxDistanceKm ?? 0
      ),
    };

    const nextOpeningHours =
      body.openingHours && typeof body.openingHours === "object"
        ? Object.fromEntries(
            Object.entries(body.openingHours).map(([day, value]: [string, any]) => [
              day,
              {
                open: toTrimmedString(value?.open),
                close: toTrimmedString(value?.close),
                closed: Boolean(value?.closed),
              },
            ])
          )
        : existingBusiness.openingHours;

    const updateDoc = {
      name: pickTrimmedString(body.name, existingBusiness.name ?? ""),
      username: typeof body.username === "string" ? body.username : existingBusiness.username,
      phone: pickTrimmedString(body.phone, existingBusiness.phone ?? ""),
      email: typeof body.email === "string" ? body.email : existingBusiness.email,
      logo: pickTrimmedString(body.logo, existingBusiness.logo ?? ""),
      description: pickTrimmedString(body.description, existingBusiness.description ?? ""),
      location: nextLocation,
      socialLinks: nextSocialLinks,
      openingHours: nextOpeningHours,
      theme: nextTheme,
      bookingRules: nextBookingRules,
      depositPolicy: nextDepositPolicy,
      mobileSettings: nextMobileSettings,
    };

    const updatedBusiness = await Business.findByIdAndUpdate(id, { $set: updateDoc }, {
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
