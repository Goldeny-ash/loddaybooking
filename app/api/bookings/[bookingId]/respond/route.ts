import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { buildManageBookingUrl } from "@/lib/booking/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const token = request.nextUrl.searchParams.get("token")?.trim();
    const action = request.nextUrl.searchParams.get("action")?.trim();

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId) || !token) {
      return NextResponse.json({ error: "Invalid booking response link." }, { status: 400 });
    }

    if (action !== "confirm" && action !== "cancel") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findOne({ _id: bookingId, manageToken: token });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const business = await Business.findById(booking.businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    if (action === "confirm") {
      booking.status = "confirmed";
      booking.confirmationStatus = "confirmed";
      booking.confirmedAt = new Date();
      await booking.save();

      if (booking.customerEmail) {
        const manageLink = buildManageBookingUrl({
          username: business.username,
          bookingId: booking._id.toString(),
          token: booking.manageToken,
        });
        await dispatchEmailEvent("BOOKING_CONFIRMATION_CONFIRMED", {
          business,
          booking,
          manageUrl: manageLink,
        });
      }
    } else {
      booking.status = "cancelled";
      booking.confirmationStatus = "not_confirmed";
      booking.cancelledAt = new Date();
      await booking.save();
    }

    const appUrl = (process.env.APP_URL || "https://booking.lodday.com").replace(/\/$/, "");
    const destination = `${appUrl}/b/${business.username}/manage?bookingId=${booking._id.toString()}&token=${token}&response=${action}`;

    return NextResponse.redirect(destination);
  } catch (error) {
    console.error("booking-respond", error);
    return NextResponse.json({ error: "Unable to process booking response." }, { status: 500 });
  }
}
