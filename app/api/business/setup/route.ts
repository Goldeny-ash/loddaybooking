import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { pingGoogleSitemap } from "@/lib/seo/googlePing";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const {
    name,
    username,
    phone,
    email,
    logo,
    openingHours,
    location,
  } = body;

  if (!name || !username || !phone) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  await connectDB();

  const slugUsername = username.toLowerCase().replace(/\s+/g, "-").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedLocation = {
    county: String(location?.county || body.county || "").trim(),
    subCounty: String(location?.subCounty || body.subCounty || "").trim(),
    ward: String(location?.ward || body.ward || "").trim(),
    locationDescription: String(
      location?.locationDescription || body.locationDescription || ""
    ).trim(),
    countyOptions: Array.isArray(location?.countyOptions)
      ? location.countyOptions.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [],
    subCountyOptions: Array.isArray(location?.subCountyOptions)
      ? location.subCountyOptions.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [],
    wardOptions: Array.isArray(location?.wardOptions)
      ? location.wardOptions.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [],
  };

  if (!normalizedLocation.county || !normalizedLocation.subCounty) {
    return NextResponse.json(
      { error: "County and sub-county are required" },
      { status: 400 }
    );
  }

  // Username uniqueness
  const usernameTaken = await Business.findOne({ username: slugUsername });
  if (usernameTaken && usernameTaken.clerkUserId !== userId) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  // Business name uniqueness (case insensitive)
  const nameTaken = await Business.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });

  if (nameTaken && nameTaken.clerkUserId !== userId) {
    return NextResponse.json(
      { error: "Business name already exists" },
      { status: 409 }
    );
  }

  if (normalizedEmail) {
    const emailTaken = await Business.findOne({
      email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: "i" },
      clerkUserId: { $ne: userId },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: "Business email already in use" },
        { status: 409 }
      );
    }
  }

  const now = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const access = {
    status: "TRIAL",
    trialStartedAt: now,
    trialEndsAt,
  };

  const business = await Business.findOneAndUpdate(
    { clerkUserId: userId },
    {
      clerkUserId: userId,
      name,
      username: slugUsername,
      phone,
      email: normalizedEmail,
      logo,
      openingHours,
      location: normalizedLocation,
      setupStep: 2,
      access,
    },
    { new: true, upsert: true }
  );

  void pingGoogleSitemap();

  return NextResponse.json({ success: true, business });
}
