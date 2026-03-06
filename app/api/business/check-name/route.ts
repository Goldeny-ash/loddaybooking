import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoDB";
import Business from "@/lib/models/Business";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawName = searchParams.get("name") || "";
  const name = rawName.trim();

  if (!name) {
    return NextResponse.json({ available: false });
  }

  await connectDB();

  const exists = await Business.findOne({
    name: {
      $regex: `^${escapeRegex(name)}$`,
      $options: "i",
    },
  });

  return NextResponse.json({ available: !exists });
}
