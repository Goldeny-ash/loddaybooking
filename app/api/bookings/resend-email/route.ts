import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function POST(req: Request) {
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
  }).populate("businessId", "name");

  if (!booking) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!booking.customerEmail) {
    return NextResponse.json(
      { error: "No email available" },
      { status: 400 }
    );
  }

  const manageUrl = `${process.env.APP_URL}/manage/${booking._id}?token=${booking.manageToken}`;

  await transporter.sendMail({
    from: `"${booking.businessId.name}" <${process.env.GMAIL_USER}>`,
    to: booking.customerEmail,
    subject: `Booking Confirmation: ${booking.businessId.name}`,
    html: `
      <p>Your booking is <strong>${booking.status}</strong></p>
      <p>Manage your booking:</p>
      <a href="${manageUrl}">${manageUrl}</a>
    `,
  });

  return NextResponse.json({ ok: true });
}
