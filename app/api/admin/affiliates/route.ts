import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongoDB";
import Affiliate from "@/lib/models/Affiliate";

function generateCode(length = 7) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function GET() {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const affiliates = await Affiliate.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ affiliates });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json();

  if (!body?.name || !body?.email || !body?.phone) {
    return NextResponse.json({ error: "name, email and phone are required" }, { status: 400 });
  }

  const accessCode = `A${generateCode(6)}`;
  const referralCode = `R${generateCode(6)}`;
  const now = new Date();
  const codeExpiresAt = new Date(now);
  codeExpiresAt.setMonth(codeExpiresAt.getMonth() + 2);

  const affiliate = await Affiliate.create({
    name: String(body.name).trim(),
    email: String(body.email).trim().toLowerCase(),
    phone: String(body.phone).trim(),
    accessCode,
    referralCode,
    codeExpiresAt,
  });

  return NextResponse.json({ affiliate });
}
