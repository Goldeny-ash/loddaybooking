import { connectDB } from "@/lib/mongoDB";
import ReferenceImage from "@/lib/models/ReferenceImage";
import { NextRequest, NextResponse } from "next/server";

type UpdateImageInput = {
  url?: string;
  description?: string;
  totalCost?: number;
  durationMinutes?: number;
  priceBreakdown?: string;
  likes?: number;
};

const parseAmount = (value: unknown) => {
  const normalized = String(value ?? "")
    .replace(/,/g, "")
    .trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const body = await req.json();
  const rawImages = Array.isArray(body.images) ? (body.images as UpdateImageInput[]) : null;

  if (!rawImages) {
    return NextResponse.json({ error: "images array is required" }, { status: 400 });
  }

  const images = rawImages
    .map((img) => ({
      url: String(img.url || "").trim(),
      description: String(img.description || "").trim(),
      totalCost: parseAmount(img.totalCost),
      durationMinutes: Math.max(Number(img.durationMinutes || 0), 0),
      priceBreakdown: String(img.priceBreakdown || "").trim(),
      likes: Number(img.likes || 0),
    }))
    .filter((img) => img.url);

  if (!images.length) {
    return NextResponse.json({ error: "At least one valid image is required" }, { status: 400 });
  }

  const updated = await ReferenceImage.findByIdAndUpdate(
    id,
    { $set: { images } },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Reference image not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, refImage: updated });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const body = await req.json();
  const imageIndex = Number(body.imageIndex);
  const delta = Number(body.delta);

  if (!Number.isInteger(imageIndex) || !Number.isFinite(delta)) {
    return NextResponse.json({ error: "Invalid imageIndex or delta" }, { status: 400 });
  }

  const ref = await ReferenceImage.findById(id);
  if (!ref) {
    return NextResponse.json({ error: "Reference image not found" }, { status: 404 });
  }

  if (!Array.isArray(ref.images) || imageIndex < 0 || imageIndex >= ref.images.length) {
    return NextResponse.json({ error: "Image index out of range" }, { status: 400 });
  }

  const current = Number(ref.images[imageIndex].likes || 0);
  const next = Math.max(current + delta, 0);
  ref.images[imageIndex].likes = next;
  await ref.save();

  return NextResponse.json({ ok: true, likes: next });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const ref = await ReferenceImage.findById(id);
  if (!ref) {
    return NextResponse.json({ error: "Reference image not found" }, { status: 404 });
  }

  await ref.deleteOne();
  return NextResponse.json({ ok: true });
}
