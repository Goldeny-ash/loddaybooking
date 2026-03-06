import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import User from "@/lib/models/User";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const user = await User.findOne({ clerkUserId: userId });
  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await connectDB();

  const normalizedEmail = String(body.email || "").trim().toLowerCase();
  if (normalizedEmail) {
    const emailTaken = await User.findOne({
      email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: "i" },
      clerkUserId: { $ne: userId },
    });

    if (emailTaken) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
  }

  const existing = await User.findOne({ clerkUserId: userId });
  if (existing) {
    return NextResponse.json({ user: existing });
  }

  const user = await User.create({
    clerkUserId: userId,
    firstName: body.firstName,
    lastName: body.lastName,
    email: normalizedEmail,
    phone: body.phone,
  });

  return NextResponse.json({ success: true, user });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await connectDB();

  if (typeof body.email === "string") {
    const normalizedEmail = body.email.trim().toLowerCase();
    if (normalizedEmail) {
      const emailTaken = await User.findOne({
        email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: "i" },
        clerkUserId: { $ne: userId },
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }
    body.email = normalizedEmail;
  }

  const user = await User.findOneAndUpdate(
    { clerkUserId: userId },
    { $set: body },
    { new: true }
  );

  return NextResponse.json({ success: true, user });
}
