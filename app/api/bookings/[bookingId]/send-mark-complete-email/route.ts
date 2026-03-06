import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await params;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    await connectDB();

    const business = await Business.findOne({ clerkUserId: userId });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      businessId: business._id,
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Only confirmed bookings can receive this email" },
        { status: 400 }
      );
    }

    const customerEmail =
      typeof booking.customerEmail === "string" ? booking.customerEmail.trim() : "";
    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email not available" }, { status: 400 });
    }

    if (!booking.manageToken) {
      return NextResponse.json({ error: "Manage token missing" }, { status: 400 });
    }

    const appUrl = (process.env.APP_URL || "https://booking.lodday.com").replace(/\/$/, "");
    const manageUrl = `${appUrl}/b/${business.username}/manage?bookingId=${booking._id}&token=${booking.manageToken}`;

    await dispatchEmailEvent("MARK_COMPLETE_REMINDER", {
      business,
      booking,
      completeUrl: manageUrl,
    });

    booking.completionReminderSent = true;
    await booking.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST send-mark-complete-email failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
