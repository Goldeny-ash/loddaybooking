import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Affiliate from "@/lib/models/Affiliate";
import { connectDB } from "@/lib/mongoDB";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;

  const affiliate = await Affiliate.findById(id)
    .select("+idDocumentData idDocumentName idDocumentMimeType")
    .lean();

  if (!affiliate?.idDocumentData || !affiliate.idDocumentMimeType) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(affiliate.idDocumentData, "base64"), {
    headers: {
      "Content-Type": affiliate.idDocumentMimeType,
      "Content-Disposition": `inline; filename="${affiliate.idDocumentName || "affiliate-id"}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
