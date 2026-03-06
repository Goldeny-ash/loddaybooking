import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoDB";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import Booking from "@/lib/models/Booking";
import Staff from "@/lib/models/Staff";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

type StaffRecipient = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    await connectDB();
    const { bookingId } = await params;

    const business = await getCurrentBusiness({ requireSetup: true });
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
    }

    const body = await req.json();
    const staffIdRaw = body.staffId;
    const note = typeof body.staffInternalNote === "string" ? body.staffInternalNote : "";

    const booking = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(bookingId),
      businessId: business._id,
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    let staffDoc: StaffRecipient | null = null;
    if (staffIdRaw) {
      if (!mongoose.Types.ObjectId.isValid(String(staffIdRaw))) {
        return NextResponse.json({ error: "Invalid staffId" }, { status: 400 });
      }

      staffDoc = await Staff.findOne({
        _id: new mongoose.Types.ObjectId(String(staffIdRaw)),
        businessId: business._id,
      }).lean();

      if (!staffDoc) {
        return NextResponse.json({ error: "Staff not found" }, { status: 404 });
      }
    }

    booking.assignedTo = staffDoc ? staffDoc._id : null;
    booking.assignedAt = staffDoc ? new Date() : null;
    booking.staffInternalNote = note;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id).populate("assignedTo", "name email");

    if (staffDoc?.email) {
      await dispatchEmailEvent("STAFF_ASSIGNED", {
        business,
        booking: updatedBooking,
        staff: staffDoc,
      });
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("PATCH /api/bookings/[bookingId]/assign failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
