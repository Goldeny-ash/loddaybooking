// /app/api/business/theme/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { primary, accent } = body;

  if (!primary || !accent) {
    return NextResponse.json({ error: "Primary and Accent are required" }, { status: 400 });
  }

  await connectDB();

  const business = await Business.findOneAndUpdate(
    { clerkUserId: userId },
    { $set: { "theme.primary": primary, "theme.accent": accent } },
    { new: true }
  );

  return NextResponse.json({ success: true, business });
}
