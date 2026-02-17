import { connectDB } from "@/lib/mongoDB";
import Subscription from "@/lib/models/Subscription";

export async function POST(req: Request) {
  await connectDB();

  const { businessId, phoneNumber } = await req.json();

  if (!businessId || !phoneNumber) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const formattedPhone = phoneNumber
  .trim()
  .replace(/\s+/g, "")
  .startsWith("0")
  ? `254${phoneNumber.trim().slice(1)}`
  : phoneNumber.replace("+", "").trim();


  const externalReference = `SUB-${businessId}-${Date.now()}`;

  const baseUrl =
    process.env.INTASEND_TEST === "true"
      ? "https://sandbox.intasend.com"
      : "https://api.intasend.com";

  try {
    const response = await fetch(
      `${baseUrl}/api/v1/payment/mpesa-stk-push/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: "Business",
          last_name: "Subscription",
          email: "billing@lodday.com",
          host: process.env.NEXT_PUBLIC_APP_URL,
          amount: 10,
          phone_number: formattedPhone,
          api_ref: externalReference,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "IntaSend error", details: data },
        { status: 500 }
      );
    }

    await Subscription.create({
      businessId,
      amount: 10,
      externalReference,
      invoiceId: data.invoice.invoice_id,
      apiRef: externalReference,
      status: "PENDING",
    });

    return Response.json({
      success: true,
      reference: externalReference,
      invoiceId: data.invoice.invoice_id,
    });
  } catch (error: any) {
    return Response.json(
      { error: "IntaSend request failed", details: error.message },
      { status: 500 }
    );
  }
}
