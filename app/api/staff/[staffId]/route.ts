// app/api/staff/[staffId]/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongoDB";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import Staff from "@/lib/models/Staff";

/* ---------------- HELPER: get staffId from URL ---------------- */
function getStaffIdFromUrl(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  return parts[parts.length - 1]; // last segment
}

/* ---------------- UPDATE STAFF ---------------- */
export async function PUT(req: Request) {
  await connectDB();

  const id = getStaffIdFromUrl(req);

  // wrap in try/catch
  try {
    const business = await getCurrentBusiness({ requireSetup: true });
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();

    const staff = await Staff.findOneAndUpdate(
      { _id: id, businessId: business._id },
      {
        name: body.name,
        role: body.role,
        services: body.services,
        specialties: body.specialties,
        email: body.email,
        phone: body.phone,
        photo: Array.isArray(body.photo) ? body.photo[0] : body.photo,
        gender: body.gender,
        isOwner: body.isOwner,
        weeklyAvailability: body.weeklyAvailability,
      },
      { new: true }
    );

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ---------------- DELETE STAFF ---------------- */
export async function DELETE(req: Request) {
  await connectDB();

  const id = getStaffIdFromUrl(req);

  try {
    const business = await getCurrentBusiness({ requireSetup: true });
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const deleted = await Staff.deleteOne({ _id: id, businessId: business._id });

    if (!deleted.deletedCount) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
