import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import { sendEmail } from "@/lib/email/sendEmail";
import { getTheme } from "@/lib/theme";
import { buildManageBookingUrl } from "@/lib/booking/utils";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { bookingId, token } = await req.json();

    if (!bookingId || !token) {
      return NextResponse.json(
        { error: "bookingId and token required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      manageToken: token,
    }).populate("businessId");

    if (!booking) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipient =
      typeof booking.customerEmail === "string" ? booking.customerEmail.trim() : "";
    if (!recipient) {
      return NextResponse.json(
        { error: "No email available" },
        { status: 400 }
      );
    }

    const business = booking.businessId as Record<string, unknown>;
    const theme = getTheme(business);
    const manageUrl = buildManageBookingUrl({
      username: String((business as { username?: string }).username || ""),
      bookingId: booking._id.toString(),
      token: booking.manageToken,
    });

    await sendEmail(
      "BOOKING_RECEIVED_CUSTOMER",
      { to: recipient },
      { business, theme, booking, manageUrl }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend email failed:", error);
    return NextResponse.json(
      { error: "Failed to resend email" },
      { status: 500 }
    );
  }
}
