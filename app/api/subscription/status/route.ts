import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const business = await Business.findOne({
    clerkUserId: user.id,
  });

  return NextResponse.json({
    status: business?.access?.status || "INACTIVE",
  });
}
