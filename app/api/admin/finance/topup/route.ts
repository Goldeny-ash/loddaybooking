import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

function normalizePhone(raw: string) {
  const cleaned = raw.trim().replace(/\s+/g, "").replace("+", "");
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  return cleaned;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const amount = Number(body.amount || 0);
  const phoneNumber = normalizePhone(String(body.phoneNumber || ""));

  if (amount <= 0 || !phoneNumber) {
    return NextResponse.json({ error: "amount and phoneNumber are required" }, { status: 400 });
  }

  const baseUrl =
    process.env.INTASEND_TEST === "true"
      ? "https://sandbox.intasend.com"
      : "https://api.intasend.com";
  const apiRef = `ADMIN-TOPUP-${Date.now()}`;

  const response = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
    },
    body: JSON.stringify({
      first_name: "Platform",
      last_name: "Topup",
      email: "finance@lodday.com",
      host: process.env.NEXT_PUBLIC_APP_URL,
      amount,
      phone_number: phoneNumber,
      api_ref: apiRef,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: "Top-up initiation failed", details: data }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    apiRef,
    invoiceId: data?.invoice?.invoice_id,
  });
}
