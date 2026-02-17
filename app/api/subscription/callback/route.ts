import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";
import Business from "@/lib/models/Business";

export async function POST(req: Request) {
  await connectDB();

  const payload = await req.json();

  if (!payload?.response?.ExternalReference) {
    return Response.json({ ok: true });
  }

  const {
    ExternalReference,
    MpesaReceiptNumber,
    CheckoutRequestID,
    ResultCode,
  } = payload.response;

  const subscription = await Subscription.findOne({
    externalReference: ExternalReference,
  });

  if (!subscription) {
    return Response.json({ ok: true });
  }

  // Idempotency
  if (subscription.status === "ACTIVE") {
    return Response.json({ ok: true });
  }

  if (ResultCode !== 0) {
    subscription.status = "EXPIRED";
    await subscription.save();
    return Response.json({ ok: true });
  }

  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setDate(expiresAt.getDate() + 30);

  subscription.status = "ACTIVE";
  subscription.mpesaReceipt = MpesaReceiptNumber;
  subscription.checkoutRequestId = CheckoutRequestID;
  subscription.startsAt = startsAt;
  subscription.expiresAt = expiresAt;

  await subscription.save();
  await Business.findOneAndUpdate(
  { _id: subscription.businessId },
  {
    subscription: {
      status: "active",
      expiresAt,
      lastPaymentRef: MpesaReceiptNumber,
    },
  }
);

  return Response.json({ success: true });
}
