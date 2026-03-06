import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoDB";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import Staff from "@/lib/models/Staff";

type OverrideBlock = {
  start: string;
  end: string;
  reason?: string;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    const business = await getCurrentBusiness({ requireSetup: true });
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const staffId = String(body.staffId || "");
    const date = String(body.date || "");
    const closed = Boolean(body.closed);
    const blocks = (Array.isArray(body.blocks) ? body.blocks : []) as OverrideBlock[];

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return NextResponse.json({ error: "Invalid staffId" }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const cleanedBlocks = blocks
      .filter((b) => TIME_RE.test(String(b.start || "")) && TIME_RE.test(String(b.end || "")))
      .map((b) => ({
        start: b.start,
        end: b.end,
        reason: (b.reason || "").trim(),
      }))
      .filter((b) => toMinutes(b.end) > toMinutes(b.start))
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    const staff = await Staff.findOne({
      _id: new mongoose.Types.ObjectId(staffId),
      businessId: business._id,
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const overrides = Array.isArray(staff.availabilityOverrides)
      ? [...staff.availabilityOverrides]
      : [];
    const existingIdx = overrides.findIndex((o) => o?.date === date);

    const nextOverride = {
      date,
      closed,
      blocks: closed ? [] : cleanedBlocks,
    };

    if (existingIdx >= 0) overrides[existingIdx] = nextOverride;
    else overrides.push(nextOverride);

    staff.availabilityOverrides = overrides;
    await staff.save();

    return NextResponse.json({
      success: true,
      override: nextOverride,
      staffId: String(staff._id),
    });
  } catch (error) {
    console.error("PUT /api/staff/overrides failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
