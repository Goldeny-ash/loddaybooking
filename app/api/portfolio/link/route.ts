import { connectDB } from "@/lib/mongoDB";
import ReferenceImage from "@/lib/models/ReferenceImage";
import mongoose from "mongoose";

export async function POST(req: Request) {
  await connectDB();

  const { refImageId, serviceIds } = await req.json();

  if (!refImageId || !Array.isArray(serviceIds)) {
    return new Response(
      JSON.stringify({ error: "Missing refImageId or invalid serviceIds" }),
      { status: 400 }
    );
  }

  const refImage = await ReferenceImage.findById(refImageId);
  if (!refImage) {
    return new Response(
      JSON.stringify({ error: "Reference image not found" }),
      { status: 404 }
    );
  }

  // Persist exact service set for this reference image.
  refImage.linkedServiceIds = Array.from(
    new Set(
      serviceIds
        .map((id: string | mongoose.Types.ObjectId) => id.toString())
        .filter(Boolean)
    )
  );

await refImage.save();


  return new Response(JSON.stringify({ ok: true, refImage }), { status: 200 });
}

// ---------------------------- GET ----------------------------
// Returns all reference images linked to a given serviceId
// GET /api/portfolio/link?serviceId=...
export async function GET(req: Request) {
  await connectDB();

  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId");

  if (!serviceId) {
    return new Response(JSON.stringify({ error: "Missing serviceId" }), { status: 400 });
  }

  // Find all reference images linked to this service
  const linkedRefs = await ReferenceImage.find({
    linkedServiceIds: serviceId,
  }).lean();

  // Flatten the images array and include the parent reference _id
  interface LinkedImage {
    _id: string;
    refId: string;
    url: string;
    description: string;
    tags: string[];
  }

  interface ReferenceImageDoc {
    _id: mongoose.Types.ObjectId;
    images?: Array<{
      _id?: mongoose.Types.ObjectId;
      url: string;
      description?: string;
      tags?: string[];
    }>;
  }

  const linkedImages: LinkedImage[] = linkedRefs.flatMap((ref: ReferenceImageDoc) =>
    (ref.images || []).map((img) => ({
      _id: img._id?.toString() || `${ref._id}-${Math.random()}`,
      refId: ref._id.toString(),
      url: img.url,
      description: img.description || "",
      tags: img.tags || [],
    }))
  ).filter(img => img.url && img.url.trim() !== "");

  return new Response(JSON.stringify({ linkedImages }), { status: 200 });
}
