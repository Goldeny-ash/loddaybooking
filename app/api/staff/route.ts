// app/api/staff/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import Staff from "@/lib/models/Staff";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function emptyAvailability() {
  return DAYS.reduce((acc, day) => {
    acc[day] = {
      start: "",
      end: "",
      closed: false,
    };
    return acc;
  }, {} as Record<string, { start: string; end: string; closed: boolean }>);
}

/* ---------------- CREATE STAFF ---------------- */

export async function POST(req: Request) {
  await connectDB();

  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body.name)
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );

  const staff = await Staff.create({
    businessId: business._id,
    name: body.name,
    role: body.role || "staff",
    services: body.services || [],
    specialties: body.specialties || [],
    email: body.email || "",
    phone: body.phone || "",
    photo: Array.isArray(body.photo) ? body.photo[0] : body.photo || "",

    
    isOwner: body.isOwner || false,
    weeklyAvailability: body.weeklyAvailability || emptyAvailability(),
  });

  return NextResponse.json({ staff });
}

/* ---------------- LIST STAFF ---------------- */

export async function GET() {
  await connectDB();

  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await Staff.find({ businessId: business._id })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({ staff });
}
