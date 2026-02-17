import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Staff from "@/lib/models/Staff";
import mongoose from "mongoose";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  await connectDB();

  const { staffId } = await params;

  const body = await req.json();
  if (!Array.isArray(body.services)) {
    return NextResponse.json({ error: "services must be an array" }, { status: 400 });
  }

  // Convert strings to ObjectId
  const serviceIds = body.services.map((id: string) => new mongoose.Types.ObjectId(id));

  const staff = await Staff.findByIdAndUpdate(
    staffId,
    { services: serviceIds },
    { new: true }
  );

  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, staff });
}
