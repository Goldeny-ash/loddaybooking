import { connectDB } from "@/lib/mongoDB";
import Deposit from "@/lib/models/Deposit";
import Booking from "@/lib/models/Booking";

export async function POST(req: Request) {
  await connectDB();

  try {
    const payload = await req.json();
    const resp = payload?.response;

    if (!resp) {
      console.warn("Deposit callback received invalid payload:", payload);
      return Response.json({ success: false, error: "Missing response object" }, { status: 400 });
    }

    const { ExternalReference, MpesaReceiptNumber, CheckoutRequestID, ResultCode } = resp;
    if (!ExternalReference) {
      return Response.json({ success: false, error: "Missing ExternalReference" }, { status: 400 });
    }

    const deposit = await Deposit.findOne({ externalReference: ExternalReference });
    if (!deposit) {
      return Response.json({ success: false, error: "Deposit not found" }, { status: 404 });
    }

    // Idempotent: skip if already processed
    if (deposit.status === "PAID" || deposit.status === "FAILED") return Response.json({ success: true });

    // Handle failed payment
    if (ResultCode !== 0) {
      deposit.status = "FAILED";
      await deposit.save();
      return Response.json({ success: true });
    }

    // Mark deposit as paid
    deposit.status = "PAID";
    deposit.mpesaReceipt = MpesaReceiptNumber || "";
    deposit.checkoutRequestId = CheckoutRequestID || "";
    deposit.paidAt = new Date();
    await deposit.save();

    // Update booking if it's waiting for deposit
    const booking = await Booking.findById(deposit.bookingId);
    if (booking && booking.status === "pendingDeposit") {
      booking.status = "confirmed";
      booking.depositId = deposit._id;
      await booking.save();
    }

    // Optional: trigger email/webhook notifications here

    return Response.json({ success: true });
  } catch (err) {
    console.error("Deposit callback error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
