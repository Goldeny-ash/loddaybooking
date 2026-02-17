import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

export const revalidate = 60;

export async function GET(req: Request) {
  const username = new URL(req.url).searchParams.get("username");
  if (!username) return NextResponse.json({ error:"Missing username" },{status:400});

  await connectDB();

  const business = await Business.findOne({ username }).lean();
  if (!business) return NextResponse.json({ error:"Not found" },{status:404});

  // DEV override ONLY here
  if (process.env.NODE_ENV === "development") {
    business.access = { status:"ACTIVE" };
  }

  return NextResponse.json(business);
}
