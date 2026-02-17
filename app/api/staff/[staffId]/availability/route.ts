import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Staff from "@/lib/models/Staff";
import mongoose from "mongoose";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function normalizeAvailability(input: any) {
  const base: Record<string, { start: string; end: string }> = {};
  for (const d of DAYS) {
    base[d] = {
      start: input?.[d]?.start || "",
      end: input?.[d]?.end || "",
    };
  }
  return base;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ staffId: string }> } // 👈 MUST be Promise
) {
  await connectDB();

  const { staffId } = await params; // 👈 MUST await

  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    return NextResponse.json({ error: "Invalid staffId" }, { status: 400 });
  }

  const body = await req.json();
  if (!body.weeklyAvailability) {
    return NextResponse.json(
      { error: "weeklyAvailability is required" },
      { status: 400 }
    );
  }

  const staff = await Staff.findByIdAndUpdate(
    staffId,
    { weeklyAvailability: normalizeAvailability(body.weeklyAvailability) },
    { new: true }
  );

  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, staff });
}
