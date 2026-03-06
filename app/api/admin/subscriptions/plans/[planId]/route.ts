import { NextResponse } from "next/server";

async function gone() {
  return NextResponse.json(
    { error: "Subscription plans are deprecated. Fixed STK subscription is in use." },
    { status: 410 }
  );
}

export const GET = gone;
export const PUT = gone;
export const DELETE = gone;
