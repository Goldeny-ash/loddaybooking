import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Provider subscription cancel is deprecated in STK-only mode." },
    { status: 410 }
  );
}
