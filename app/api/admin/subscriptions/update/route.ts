import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json(
    { error: "Provider subscription update is deprecated in STK-only mode." },
    { status: 410 }
  );
}
