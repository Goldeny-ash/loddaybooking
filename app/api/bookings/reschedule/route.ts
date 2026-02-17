import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Deposit from "@/lib/models/Deposit";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import nodemailer from "nodemailer";
import { toMinutes, overlaps } from "@/lib/availability/time";
import { generateSlots } from "@/lib/availability/engine";
import crypto from "crypto";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

const RESCHEDULE_CUTOFF_HOURS = 6;      // Cutoff window
const MAX_RESCHEDULES = 3;              // Limit number of reschedules

export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      bookingId,
      token,
      newDate,
      newStartTime,
      newEndTime,
      newStaffId,
      customerName,
      customerPhone,
      customerEmail,
      note,
      calloutFee = 0,
      adminOverride = false
    } = await req.json();

    if (!bookingId || !token || !newDate || !newStartTime || !newEndTime) {
      return NextResponse.json({ error: "Missing reschedule fields" }, { status: 400 });
    }

    const booking = await Booking.findOne({ _id: bookingId, manageToken: token });
    if (!booking) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await Business.findById(booking.businessId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const service = await Service.findById(booking.serviceId);
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    // ---------------- RESCHEDULE LIMIT ----------------
    booking.rescheduleCount = booking.rescheduleCount || 0;
    if (!adminOverride && booking.rescheduleCount >= MAX_RESCHEDULES) {
      return NextResponse.json({ error: "Maximum reschedules reached" }, { status: 403 });
    }

    // ---------------- CUTOFF CHECK ----------------
    const now = new Date();
    const bookingTime = new Date(`${booking.date}T${booking.startTime}`);
    if (!adminOverride && (bookingTime.getTime() - now.getTime() < RESCHEDULE_CUTOFF_HOURS * 60 * 60 * 1000)) {
      return NextResponse.json({ error: `Cannot reschedule within ${RESCHEDULE_CUTOFF_HOURS} hours` }, { status: 403 });
    }

    // ---------------- CONFLICT CHECK ----------------
    const existing = await Booking.find({
      businessId: booking.businessId,
      staffId: newStaffId,
      date: newDate,
      _id: { $ne: booking._id },
      status: { $ne: "cancelled" },
    });

    const clash = existing.some((b) =>
      overlaps(toMinutes(newStartTime), toMinutes(newEndTime), toMinutes(b.startTime), toMinutes(b.endTime))
    );

    if (!adminOverride && clash) {
      return NextResponse.json({ error: "That slot is no longer available" }, { status: 409 });
    }

    // ---------------- DEPOSIT LOGIC ----------------
    let depositAmount = 0;
    let depositRequired = false;

    const basePrice = service.price + (business.depositPolicy?.applyToCallout ? calloutFee : 0);

    if (service.depositOverride?.enabled) {
      depositRequired = true;
      depositAmount = service.depositOverride.type === "percent"
        ? Math.round((basePrice * service.depositOverride.value) / 100)
        : service.depositOverride.value;
    } else if (business.depositPolicy?.enabled) {
      depositRequired = true;
      depositAmount = business.depositPolicy.type === "percent"
        ? Math.round((basePrice * business.depositPolicy.value) / 100)
        : business.depositPolicy.value;
    }

    let depositToken: string | null = null;

    if (depositRequired && depositAmount > 0) {
      depositToken = crypto.randomBytes(24).toString("hex");

      const externalReference = crypto.randomBytes(24).toString("hex");
      await Deposit.create({
        bookingId: booking._id,
        businessId: booking.businessId,
        amount: depositAmount,
        phoneNumber: customerPhone.startsWith("0") ? `254${customerPhone.slice(1)}` : customerPhone.replace("+", ""),
        externalReference,
        status: "PENDING",
      });
    }

    // ---------------- UPDATE BOOKING ----------------
    booking.date = newDate;
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    booking.staffId = newStaffId;
    booking.customerName = customerName;
    booking.customerPhone = customerPhone;
    booking.customerEmail = customerEmail;
    booking.note = note;
    booking.depositAmount = depositAmount;
    booking.rescheduleCount += 1;

    if (booking.status !== "cancelled") booking.status = depositRequired ? "pending" : "confirmed";

    await booking.save();

    // ---------------- SEND EMAIL NOTIFICATIONS ----------------
    const manageUrl = `https://booking.lodday.com/manage/${booking._id}?token=${booking.manageToken}`;

    if (customerEmail) {
      const mailOptions = {
        from: `"Lodday Bookings" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject: `Booking Rescheduled: ${business.name}`,
        html: `
          <p>Hi ${customerName},</p>
          <p>Your booking with <strong>${business.name}</strong> has been rescheduled:</p>
          <p>Original: ${booking.originalDate || booking.date} ${booking.originalStartTime || booking.startTime} – ${booking.originalEndTime || booking.endTime}</p>
          <p>New: ${newDate} ${newStartTime} – ${newEndTime}</p>
          ${depositRequired ? `<p>Deposit required: KES ${depositAmount}</p>` : ""}
          <p>Manage your booking: <a href="${manageUrl}" target="_blank">${manageUrl}</a></p>
        `,
      };
      transporter.sendMail(mailOptions).catch(err => console.error("Email error:", err));
    }

    // TODO: staff notifications can be implemented here (SMS / WhatsApp / Email)

    return NextResponse.json({
      ok: true,
      booking,
      depositRequired,
      depositToken,
    });

  } catch (err) {
    console.error("Reschedule POST error:", err);
    return NextResponse.json({ error: "Failed to reschedule booking" }, { status: 500 });
  }
}
