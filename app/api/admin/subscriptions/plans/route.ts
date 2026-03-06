import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Subscription plans are deprecated. Fixed STK subscription is in use." },
    { status: 410 }
  );
}

export const POST = GET;
