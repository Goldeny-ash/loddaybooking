import mongoose from "mongoose";
import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import { connectDB } from "@/lib/mongoDB";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";

export type SupportContextType = "general" | "business" | "booking";

export type ResolvedSupportContext = {
  type: SupportContextType;
  greeting: string;
  pathname: string;
  scopeKey: string;
  title: string;
  businessId: string | null;
  businessName: string;
  bookingId: string | null;
  customerName: string;
};

type ResolveSupportContextInput = {
  pathname?: string | null;
  username?: string | null;
  bookingId?: string | null;
  token?: string | null;
};

function cleanText(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function asObjectId(value: string | null) {
  return value && mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
}

export async function resolveSupportContext(
  input: ResolveSupportContextInput
): Promise<ResolvedSupportContext> {
  const pathname = cleanText(input.pathname) || "/";
  const username = cleanText(input.username);
  const bookingId = cleanText(input.bookingId);
  const token = cleanText(input.token);

  if (bookingId && token && mongoose.Types.ObjectId.isValid(bookingId)) {
    await connectDB();

    const booking = await Booking.findOne({
      _id: bookingId,
      manageToken: token,
    })
      .populate({ path: "businessId", select: "name" })
      .select("customerName businessId")
      .lean();

    if (booking) {
      const populatedBusiness = booking.businessId as { _id?: mongoose.Types.ObjectId; name?: string } | null;
      const customerName = cleanText(booking.customerName) || "there";
      const businessName = cleanText(populatedBusiness?.name);

      return {
        type: "booking",
        greeting: `Hey ${customerName}`,
        pathname,
        scopeKey: `booking:${bookingId}`,
        title: customerName,
        bookingId,
        businessId: populatedBusiness?._id ? String(populatedBusiness._id) : null,
        businessName,
        customerName,
      };
    }
  }

  if (username) {
    await connectDB();

    const business = await Business.findOne({ username })
      .select("name")
      .lean();

    if (business?._id) {
      const businessName = cleanText(business.name) || "there";
      return {
        type: "business",
        greeting: `Hey ${businessName}`,
        pathname,
        scopeKey: `business:${String(business._id)}`,
        title: businessName,
        bookingId: null,
        businessId: String(business._id),
        businessName,
        customerName: "",
      };
    }
  }

  const currentBusiness = await getCurrentBusiness();
  if (currentBusiness?._id) {
    const businessName = cleanText(currentBusiness.name) || "there";
    return {
      type: "business",
      greeting: `Hey ${businessName}`,
      pathname,
      scopeKey: `business:${String(currentBusiness._id)}`,
      title: businessName,
      bookingId: null,
      businessId: String(currentBusiness._id),
      businessName,
      customerName: "",
    };
  }

  return {
    type: "general",
    greeting: "Hey, how can we help you?",
    pathname,
    scopeKey: `general:${pathname}`,
    title: pathname === "/" ? "Homepage visitor" : `Visitor on ${pathname}`,
    bookingId: null,
    businessId: null,
    businessName: "",
    customerName: "",
  };
}

export function supportContextToUpdate(context: ResolvedSupportContext) {
  return {
    scopeType: context.type,
    scopeKey: context.scopeKey,
    pathname: context.pathname,
    bookingId: asObjectId(context.bookingId),
    businessId: asObjectId(context.businessId),
    businessName: context.businessName,
    customerName: context.customerName,
    title: context.title,
  };
}

export function renderSupportNotificationEmail(params: {
  adminUrl: string;
  conversationId: string;
  context: ResolvedSupportContext;
  message: string;
}) {
  const { adminUrl, conversationId, context, message } = params;
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  const details = [
    `Scope: ${context.type}`,
    context.businessName ? `Business: ${context.businessName}` : "",
    context.customerName ? `Customer: ${context.customerName}` : "",
    context.bookingId ? `Booking ID: ${context.bookingId}` : "",
    context.pathname ? `Page: ${context.pathname}` : "",
  ]
    .filter(Boolean)
    .map((item) => `<li style="margin:0 0 6px;">${item}</li>`)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
      <h2 style="margin:0 0 12px;">New support message</h2>
      <p style="margin:0 0 16px;">A visitor sent a new message in support chat.</p>
      <div style="margin:0 0 16px;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
        ${safeMessage}
      </div>
      <ul style="margin:0 0 20px;padding-left:18px;">
        ${details}
      </ul>
      <a
        href="${adminUrl}"
        style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15616D;color:#ffffff;text-decoration:none;font-weight:700;"
      >
        Open conversation
      </a>
      <p style="margin:16px 0 0;font-size:12px;color:#64748b;">Conversation ID: ${conversationId}</p>
    </div>
  `;
}
