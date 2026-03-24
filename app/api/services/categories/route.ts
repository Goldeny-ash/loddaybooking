import { connectDB } from "@/lib/mongoDB";
import Service from "@/lib/models/Service";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();

  const categories = await Service.distinct("category");

  return NextResponse.json({ categories });
}