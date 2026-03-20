import { NextResponse } from "next/server";

import {
  isValidKenyanPhone,
  normalizeAffiliateEmail,
  normalizeKenyanPhone,
  sendAffiliateApplicationReceivedEmail,
  sendAffiliateApplicationReviewAlertEmail,
} from "@/lib/affiliates";
import { connectDB } from "@/lib/mongoDB";
import Affiliate from "@/lib/models/Affiliate";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request) {
  try {
    await connectDB();

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const rawEmail = String(formData.get("email") || "").trim();
    const rawPhone = String(formData.get("phone") || "").trim();
    const idDocument = formData.get("idDocument");

    if (!name || !rawEmail || !rawPhone) {
      return NextResponse.json(
        { error: "Name, email and phone number are required." },
        { status: 400 }
      );
    }

    const email = normalizeAffiliateEmail(rawEmail);
    const phone = normalizeKenyanPhone(rawPhone);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (!isValidKenyanPhone(phone)) {
      return NextResponse.json(
        { error: "Enter a valid Kenyan M-Pesa phone number." },
        { status: 400 }
      );
    }

    if (!(idDocument instanceof File)) {
      return NextResponse.json({ error: "ID document is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(idDocument.type)) {
      return NextResponse.json(
        { error: "Upload a PNG, JPG, WEBP or PDF file." },
        { status: 400 }
      );
    }

    if (idDocument.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ID document must be smaller than 5MB." },
        { status: 400 }
      );
    }

    const [emailExists, phoneExists] = await Promise.all([
      Affiliate.findOne({ email }).lean(),
      Affiliate.findOne({ phone }).lean(),
    ]);

    if (emailExists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    if (phoneExists) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }

    const buffer = Buffer.from(await idDocument.arrayBuffer());

    const affiliate = await Affiliate.create({
      name,
      email,
      phone,
      idDocumentName: idDocument.name,
      idDocumentMimeType: idDocument.type,
      idDocumentData: buffer.toString("base64"),
      status: "PENDING",
    });

    affiliate.idDocumentUrl = `/api/admin/affiliates/${affiliate._id.toString()}/document`;
    await affiliate.save();

    void sendAffiliateApplicationReceivedEmail({
      email,
      name,
    }).catch((error) => {
      console.error("affiliate-application-received-email", error);
    });

    void sendAffiliateApplicationReviewAlertEmail({
      name,
      email,
      phone,
    }).catch((error) => {
      console.error("affiliate-application-review-alert-email", error);
    });

    return NextResponse.json({
      success: true,
      message: "Application received. You will be notified after review.",
    });
  } catch (error) {
    console.error("affiliate-apply", error);

    return NextResponse.json(
      { error: "Unable to submit your application right now." },
      { status: 500 }
    );
  }
}
