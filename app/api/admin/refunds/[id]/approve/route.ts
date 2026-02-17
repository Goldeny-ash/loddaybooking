// app/api/admin/refunds/[id]/approve/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";
import Deposit from "@/lib/models/Deposit";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import crypto from "crypto";
import axios from "axios";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requirePlatformOwner();
  console.log("[POST] Authorized user:", userId);

  await connectDB();

  const { id } = await context.params;
  console.log("[ApproveRefund] params.id:", id);

  const refund = await Refund.findById(id).populate("bookingId");
  if (!refund) {
    console.log("[ApproveRefund] Refund not found");
    return NextResponse.json({ error: "Refund not found" }, { status: 404 });
  }

  if (refund.status !== "REQUESTED") {
    console.log("[ApproveRefund] Refund not in REQUESTED status:", refund.status);
    return NextResponse.json({ error: "Refund not eligible for approval" }, { status: 400 });
  }

  // Auto-approve refund
  refund.status = "APPROVED";
  refund.approvedAt = new Date();
  await refund.save();
  console.log("[ApproveRefund] Refund approved");

  // Find deposit associated with booking
  const deposit = await Deposit.findOne({ bookingId: refund.bookingId._id });
  if (!deposit || !deposit.phoneNumber) {
    console.log("[ApproveRefund] Deposit or phone number missing");
    return NextResponse.json({ error: "Deposit not found or missing phone number" }, { status: 400 });
  }

  const externalReference = `refund_${crypto.randomBytes(8).toString("hex")}`;

  try {
    console.log("[ApproveRefund] Sending payout to PayHero for phone:", deposit.phoneNumber);

    const resp = await axios.post(
      "https://backend.payhero.co.ke/api/v2/withdraw",
      {
        external_reference: externalReference,
        amount: refund.amount,
        phone_number: deposit.phoneNumber,
        network_code: "63902", // MPESA
        callback_url: `${process.env.BASE_URL}/api/payhero/refund-callback`,
        channel: "mobile",
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        payment_service: "b2c",
      },
      {
         headers: {
      Authorization: `Basic ${process.env.PAYHERO_API_SECRET}`, // ✅ must include "Basic "
      "Content-Type": "application/json",
        },
      }
    );

    refund.status = "SENT";
    refund.externalReference = externalReference;
    refund.payheroCheckoutId = resp.data.checkout_request_id;
    refund.payheroConversationId = resp.data.conversation_id;
    refund.sentAt = new Date();
    await refund.save();

    console.log("[ApproveRefund] Refund sent successfully:", resp.data);

    return NextResponse.json({ success: true, data: resp.data });
  } catch (err: any) {
    console.error("[ApproveRefund] PayHero error:", err.response?.data || err.message);

    refund.status = "FAILED";
    refund.failureReason = err.response?.data?.message || err.message;
    refund.failedAt = new Date();
    await refund.save();

    return NextResponse.json({ error: "Failed to send payout", details: err.response?.data || err.message }, { status: 500 });
  }
}
