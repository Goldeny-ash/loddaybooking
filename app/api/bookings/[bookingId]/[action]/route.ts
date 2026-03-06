import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Deposit from "@/lib/models/Deposit";
import Business from "@/lib/models/Business";
import mongoose from "mongoose";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import crypto from "crypto";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string; action: string }> }
) {
  try {
    const { bookingId, action } = await params;
    const body = await req.json();

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const business = await Business.findById(booking.businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const update: {
      status?: string;
      depositId?: string;
      rejectionReason?: string;
    } = {};

    if (action === "approve") {
      update.status = "pendingDeposit";

      const depositAmount = booking.depositAmount || 0;
      const depositRequired =
        Boolean(business.depositPolicy?.enabled) && depositAmount > 0;

      

      const updatedBooking = await Booking.findByIdAndUpdate(bookingId, update, {
        new: true,
      });

      if (!updatedBooking) {
        return NextResponse.json({ error: "Booking update failed" }, { status: 500 });
      }

      if (updatedBooking.customerEmail) {
        const manageLink = `https://booking.lodday.com/manage/${updatedBooking._id}?token=${updatedBooking.manageToken}`;
        await dispatchEmailEvent("BOOKING_APPROVED", {
          business,
          booking: updatedBooking,
          paymentUrl: manageLink,
          calendarUrl: manageLink,
        });
      }

      return NextResponse.json({ booking: updatedBooking });
    }

    if (action === "reject") {
      update.status = "rejected";
      update.rejectionReason = body.rejectionReason || "No reason provided";

      const updatedBooking = await Booking.findByIdAndUpdate(bookingId, update, {
        new: true,
      });

      if (!updatedBooking) {
        return NextResponse.json({ error: "Booking update failed" }, { status: 500 });
      }

      if (updatedBooking.customerEmail) {
        const manageLink = `https://booking.lodday.com/manage/${updatedBooking._id}?token=${updatedBooking.manageToken}`;
        await dispatchEmailEvent("BOOKING_REJECTED", {
          business,
          booking: updatedBooking,
          rescheduleUrl: manageLink,
        });
      }

      return NextResponse.json({ booking: updatedBooking });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/bookings/[bookingId]/[action] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
