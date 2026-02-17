import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const {
    name,
    username,
    phone,
    email,
    logo,
    bookingRules,
    notificationPrefs,
    location,
    mode,
  } = body;

  if (!name || !username || !phone) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  await connectDB();

  const slugUsername = username.toLowerCase().replace(/\s+/g, "-").trim();

  const taken = await Business.findOne({ username: slugUsername });
  if (taken && taken.clerkUserId !== userId) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const now = new Date();

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const access =
    mode === "subscribe"
      ? { status: "INACTIVE" }
      : {
          status: "TRIAL",
          trialStartedAt: now,
          trialEndsAt,
        };

  const business = await Business.findOneAndUpdate(
    { clerkUserId: userId },
    {
      clerkUserId: userId,
      name,
      username: slugUsername,
      phone,
      email,
      logo,
      bookingRules,
      notificationPrefs,
      location,
      setupStep: 1,
      access,
    },
    { new: true, upsert: true }
  );

  return NextResponse.json({ success: true, business });
}

