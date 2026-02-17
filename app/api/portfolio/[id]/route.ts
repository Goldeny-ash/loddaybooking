import { connectDB } from "@/lib/mongoDB";
import ReferenceImage from "@/lib/models/ReferenceImage";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ wrap in Promise for validator
) {
  const { id } = await params; // ✅ unwrap

  await connectDB();

  const ref = await ReferenceImage.findById(id);
  if (!ref) {
    return new Response(JSON.stringify({ error: "Reference image not found" }), { status: 404 });
  }

  await ref.deleteOne();
  return new Response(JSON.stringify({ ok: true }));
}
