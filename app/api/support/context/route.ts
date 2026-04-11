import { NextResponse } from "next/server";
import { resolveSupportContext } from "@/lib/support";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const context = await resolveSupportContext({
    pathname: searchParams.get("pathname"),
    username: searchParams.get("username"),
    bookingId: searchParams.get("bookingId"),
    token: searchParams.get("token"),
  });

  return NextResponse.json({ context });
}
