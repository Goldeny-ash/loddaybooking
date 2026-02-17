import { connectDB } from "@/lib/mongoDB";
import ReferenceImage from "@/lib/models/ReferenceImage";

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
