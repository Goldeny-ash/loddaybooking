import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ exists: false });
  }

  await connectDB();

  const business = await Business.findOne({ clerkUserId: userId });

  return NextResponse.json({
    exists: !!business,
  });
}
