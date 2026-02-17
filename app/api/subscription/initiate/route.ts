import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";

export async function POST(req: Request) {
  await connectDB();

  const { businessId, phoneNumber } = await req.json();

  if (!businessId || !phoneNumber) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const formattedPhone = phoneNumber.startsWith("0")
    ? `254${phoneNumber.slice(1)}`
    : phoneNumber.replace("+", "");

  const externalReference = `SUB-${businessId}-${Date.now()}`;

  await Subscription.create({
    businessId,
    amount: 500,
    externalReference,
    status: "PENDING",
  });

  const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${process.env.PAYHERO_API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 500,
      phone_number: formattedPhone,
      channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
      provider: "m-pesa",
      external_reference: externalReference,
      customer_name: "Business Subscription",
      callback_url: `${process.env.BASE_URL}/api/subscription/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return Response.json(
      { error: "PayHero error", details: error },
      { status: 500 }
    );
  }

  const data = await response.json();

  return Response.json({
    success: true,
    reference: externalReference,
    payhero: data,
  });
}
