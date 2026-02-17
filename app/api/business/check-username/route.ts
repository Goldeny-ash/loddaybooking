import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let username = searchParams.get("username");

  if (!username) return NextResponse.json({ available: false });

  // Normalize username to match what DB stores
  username = username.toLowerCase().replace(/\s+/g, "-").trim();

  await connectDB();

  const exists = await Business.findOne({ username });

  return NextResponse.json({
    available: !exists,
  });
}
