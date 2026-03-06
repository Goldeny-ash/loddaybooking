import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Provider customer sync is deprecated in STK-only mode." },
    { status: 410 }
  );
}
