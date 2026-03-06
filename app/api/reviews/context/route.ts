import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";

interface BusinessLite {
  _id: mongoose.Types.ObjectId;
  name?: string;
  username?: string;
  logo?: string;
}

interface BookingContextDoc {
  _id: mongoose.Types.ObjectId;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  businessId?: BusinessLite;
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId")?.trim();
  const token = searchParams.get("token")?.trim();

  const { userId } = await auth();

  let loggedBusiness: BusinessLite | null = null;
  if (userId) {
    loggedBusiness = await Business.findOne({ clerkUserId: userId })
      .select("_id name username logo")
      .lean();
  }

  let bookingContext: {
    bookingId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    businessId: string;
    businessName: string;
    businessUsername: string;
    businessLogo: string;
  } | null = null;

  if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
    const query: Record<string, unknown> = { _id: bookingId };
    if (token) query.manageToken = token;

    const booking = (await Booking.findOne(query)
      .populate({ path: "businessId", select: "name username logo" })
      .select("customerName customerEmail customerPhone businessId")
      .lean()) as BookingContextDoc | null;

    if (booking) {
      bookingContext = {
        bookingId: String(booking._id),
        customerName: booking.customerName || "",
        customerEmail: booking.customerEmail || "",
        customerPhone: booking.customerPhone || "",
        businessId: booking.businessId?._id ? String(booking.businessId._id) : "",
        businessName: booking.businessId?.name || "",
        businessUsername: booking.businessId?.username || "",
        businessLogo: booking.businessId?.logo || "",
      };
    }
  }

  return NextResponse.json({
    booking: bookingContext,
    loggedBusiness: loggedBusiness
      ? {
          id: String(loggedBusiness._id),
          name: loggedBusiness.name || "",
          username: loggedBusiness.username || "",
          logo: loggedBusiness.logo || "",
        }
      : null,
  });
}
