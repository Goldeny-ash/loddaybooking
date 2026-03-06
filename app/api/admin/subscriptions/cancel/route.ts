import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Provider-managed subscription cancel is deprecated." },
    { status: 410 }
  );
}
