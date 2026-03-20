import { connectDB } from "@/lib/mongoDB";
import ReferenceImage from "@/lib/models/ReferenceImage";

type UploadImageInput = {
  url?: string;
  description?: string;
  totalCost?: number;
  durationMinutes?: number;
  priceBreakdown?: string;
};

const parseAmount = (value: unknown) => {
  const normalized = String(value ?? "")
    .replace(/,/g, "")
    .trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return new Response(JSON.stringify({ error: "Missing businessId" }), { status: 400 });
  }

  const images = await ReferenceImage.find({ businessId });
  return new Response(JSON.stringify({ ok: true, images }));
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  const rawImages = Array.isArray(body.images) ? (body.images as UploadImageInput[]) : [];

  if (!businessId) {
    return new Response(JSON.stringify({ error: "Missing businessId" }), { status: 400 });
  }

  if (!rawImages.length) {
    return new Response(JSON.stringify({ error: "No images provided" }), { status: 400 });
  }

  const images = rawImages
    .map((img) => ({
      url: String(img.url || "").trim(),
      description: String(img.description || "").trim(),
      totalCost: parseAmount(img.totalCost),
      durationMinutes: Math.max(Number(img.durationMinutes || 0), 0),
      priceBreakdown: String(img.priceBreakdown || "").trim(),
      likes: 0,
    }))
    .filter((img) => img.url);

  if (!images.length) {
    return new Response(JSON.stringify({ error: "No valid image URLs found" }), { status: 400 });
  }

  const refImage = await ReferenceImage.create({
    businessId,
    images,
    linkedServiceIds: [],
  });

  return new Response(JSON.stringify({ ok: true, refImage }), { status: 201 });
}
