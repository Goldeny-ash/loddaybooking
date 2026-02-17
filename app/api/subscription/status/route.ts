import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";
import Business from "@/lib/models/Business";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return Response.json({ error: "Missing reference" }, { status: 400 });
  }

  const subscription = await Subscription.findOne({
    externalReference: reference,
  });

  if (!subscription) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (subscription.status === "ACTIVE") {
    return Response.json({ status: "ACTIVE" });
  }

  const baseUrl =
    process.env.INTASEND_TEST === "true"
      ? "https://sandbox.intasend.com"
      : "https://api.intasend.com";

  try {
    const response = await fetch(
      `${baseUrl}/api/v1/payment/status/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_id: subscription.invoiceId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ status: "PENDING" });
    }

    const state = data.invoice.state;

    if (state === "COMPLETE") {
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(startsAt.getDate() + 30);

      subscription.status = "ACTIVE";
      subscription.startsAt = startsAt;
      subscription.expiresAt = expiresAt;
      await subscription.save();

      await Business.findOneAndUpdate(
        { _id: subscription.businessId },
        {
          subscription: {
            status: "active",
            expiresAt,
            lastPaymentRef: subscription.invoiceId,
          },
        }
      );

      return Response.json({ status: "ACTIVE" });
    }

    if (state === "FAILED") {
      subscription.status = "EXPIRED";
      await subscription.save();
      return Response.json({ status: "FAILED" });
    }

    return Response.json({ status: "PENDING" });
  } catch (err) {
    return Response.json({ status: "PENDING" });
  }
}
