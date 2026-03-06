import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Plan-based subscription creation is deprecated. Use STK subscription flow." },
    { status: 410 }
  );
}
