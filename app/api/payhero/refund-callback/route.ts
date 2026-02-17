import { connectDB } from "@/lib/mongoDB";
import Refund from "@/lib/models/Refund";
import Booking from "@/lib/models/Booking";

export async function POST(req: Request) {
  await connectDB();

  const payload = await req.json();
  const resp = payload?.response;

  if (!resp?.ExternalReference) {
    return Response.json({ success: false });
  }

  const refund = await Refund.findOne({
    externalReference: resp.ExternalReference,
  });

  if (!refund) return Response.json({ success: false });

  // idempotent
  if (refund.status === "PAID" || refund.status === "FAILED") {
    return Response.json({ success: true });
  }

  if (resp.ResultCode !== 0) {
    refund.status = "FAILED";
    refund.failureReason = resp.ResultDesc;
    refund.failedAt = new Date();
    await refund.save();
    return Response.json({ success: true });
  }

  refund.status = "PAID";
  refund.mpesaReceipt = resp.MpesaReceiptNumber || "";
  refund.paidAt = new Date();
  await refund.save();

  const booking = await Booking.findById(refund.bookingId);
  if (booking) {
    booking.depositRefunded = true;
    booking.status = "refunded";
    await booking.save();
  }

  return Response.json({ success: true });
}
