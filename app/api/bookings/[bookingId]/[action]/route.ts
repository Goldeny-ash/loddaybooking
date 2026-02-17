import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Deposit from "@/lib/models/Deposit";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string; action: string }> }
) {
  try {
    const { bookingId, action } = await params;
    const body = await req.json();

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId))
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });

    if (!["approve", "reject"].includes(action))
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const business = await Business.findById(booking.businessId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const update: {
      status?: string;
      depositId?: string;
      rejectionReason?: string;
    } = {};
    let emailSubject = "";
    let emailHtml = "";

    // ---------------- APPROVE ----------------
  if (action === "approve") {
  update.status = "pendingDeposit";

  // Calculate total base price from services
 // Calculate total base price from services
const basePrice = 
  booking.services.reduce(
    (sum: number, s: { price?: number }) => sum + (s.price || 0),
    0
  ) + (booking.calloutFee || 0);

// Use const instead of let for depositAmount
const depositAmount = booking.depositAmount || 0; // KEEP existing depositAmount
let depositRequired = false;


  // Check if business requires deposit override
  if (business.depositPolicy?.enabled && depositAmount > 0) {
    depositRequired = true;
    // Use existing depositAmount; don't overwrite booking.depositAmount
  }

  // ---------------- CREATE DEPOSIT RECORD ----------------
  if (depositRequired && depositAmount > 0) {
    let deposit = await Deposit.findOne({
      bookingId: booking._id,
      status: "PENDING",
    });

    if (!deposit) {
      const externalReference = crypto.randomBytes(24).toString("hex");

      deposit = await Deposit.create({
        bookingId: booking._id,
        businessId: booking.businessId,
        amount: depositAmount,
        phoneNumber: booking.customerPhone.startsWith("0")
          ? `254${booking.customerPhone.slice(1)}`
          : booking.customerPhone.replace("+", ""),
        externalReference,
        status: "PENDING",
      });

      update.depositId = deposit._id;
    } else {
      update.depositId = deposit._id;
    }
  }


      // ---------------- CREATE DEPOSIT RECORD ----------------
      if (depositRequired && depositAmount > 0) {
        let deposit = await Deposit.findOne({
          bookingId: booking._id,
          status: "PENDING",
        });

        if (!deposit) {
          const externalReference = crypto.randomBytes(24).toString("hex");

          deposit = await Deposit.create({
            bookingId: booking._id,
            businessId: booking.businessId,
            amount: depositAmount,
            phoneNumber: booking.customerPhone.startsWith("0")
              ? `254${booking.customerPhone.slice(1)}`
              : booking.customerPhone.replace("+", ""),
            externalReference,
            status: "PENDING",
          });

          update.depositId = deposit._id;
        } else {
          update.depositId = deposit._id;
        }
      }

      // ---------------- EMAIL CUSTOMER ----------------
      if (booking.customerEmail) {
        const manageLink = `https://booking.lodday.com/manage/${booking._id}?token=${booking.manageToken}`;

        emailSubject = `Booking Approved — ${business.name}`;

        emailHtml = `
          <p>Hi ${booking.customerName},</p>

          <p>Your booking with <strong>${business.name}</strong> on
          <strong>${booking.date}</strong> from
          <strong>${booking.startTime}</strong> to
          <strong>${booking.endTime}</strong> has been approved.</p>

          ${
            depositRequired && depositAmount > 0
              ? `<p><strong>Deposit required:</strong> KES ${depositAmount}</p>`
              : ""
          }

          <p>Manage & pay here:
            <a href="${manageLink}" target="_blank">${manageLink}</a>
          </p>

          <p>Thank you,<br/>${business.name}</p>
        `;

        transporter.sendMail({
          from: `"${business.name}" <${process.env.GMAIL_USER}>`,
          to: booking.customerEmail,
          subject: emailSubject,
          html: emailHtml,
        });
      }
    }

    // ---------------- REJECT ----------------
    if (action === "reject") {
      update.status = "rejected";
      update.rejectionReason = body.rejectionReason || "No reason provided";

      if (booking.customerEmail) {
        const manageLink = `https://booking.lodday.com/manage/${booking._id}?token=${booking.manageToken}`;

        emailSubject = `Booking Rejected — ${business.name}`;
        emailHtml = `
          <p>Hi ${booking.customerName},</p>

          <p>Your booking with <strong>${business.name}</strong> on
          <strong>${booking.date}</strong> from
          <strong>${booking.startTime}</strong> to
          <strong>${booking.endTime}</strong> has been rejected.</p>

          <p><strong>Reason:</strong> ${update.rejectionReason}</p>

          <p>View booking:
            <a href="${manageLink}" target="_blank">${manageLink}</a>
          </p>

          <p>${business.name}</p>
        `;

        transporter.sendMail({
          from: `"${business.name}" <${process.env.GMAIL_USER}>`,
          to: booking.customerEmail,
          subject: emailSubject,
          html: emailHtml,
        });
      }
    }

    // ---------------- UPDATE BOOKING ----------------
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, update, { new: true });

    return NextResponse.json({ booking: updatedBooking });
  } catch (err) {
    console.error("Booking action error:", err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
