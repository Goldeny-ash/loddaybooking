import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Provider transaction sync is deprecated in STK-only mode." },
    { status: 410 }
  );
}
