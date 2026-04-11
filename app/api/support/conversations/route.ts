import { NextResponse } from "next/server";
import { sendEmail as sendSmtpEmail } from "@/lib/email/transporter";
import { connectDB } from "@/lib/mongoDB";
import SupportConversation from "@/lib/models/SupportConversation";
import { getSiteUrl } from "@/lib/seo";
import {
  renderSupportNotificationEmail,
  resolveSupportContext,
  supportContextToUpdate,
} from "@/lib/support";

function normalizeConversation(conversation: any) {
  return {
    id: String(conversation._id),
    visitorId: conversation.visitorId,
    scopeType: conversation.scopeType,
    scopeKey: conversation.scopeKey,
    pathname: conversation.pathname || "/",
    bookingId: conversation.bookingId ? String(conversation.bookingId) : null,
    businessId: conversation.businessId ? String(conversation.businessId) : null,
    businessName: conversation.businessName || "",
    customerName: conversation.customerName || "",
    title: conversation.title || "",
    unreadForAdmin: Boolean(conversation.unreadForAdmin),
    unreadForVisitor: Boolean(conversation.unreadForVisitor),
    lastMessageAt: conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toISOString() : null,
    lastMessagePreview: conversation.lastMessagePreview || "",
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map((message: any) => ({
          id: String(message._id),
          senderRole: message.senderRole,
          text: message.text,
          createdAt: new Date(message.createdAt).toISOString(),
        }))
      : [],
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const visitorId = String(searchParams.get("visitorId") || "").trim();

  if (!visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }

  const context = await resolveSupportContext({
    pathname: searchParams.get("pathname"),
    username: searchParams.get("username"),
    bookingId: searchParams.get("bookingId"),
    token: searchParams.get("token"),
  });

  await connectDB();

  const conversation = await SupportConversation.findOne({
    visitorId,
    scopeKey: context.scopeKey,
  }).lean();

  return NextResponse.json({
    context,
    conversation: conversation ? normalizeConversation(conversation) : null,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const visitorId = String(body?.visitorId || "").trim();
  const message = String(body?.message || "").trim();

  if (!visitorId || !message) {
    return NextResponse.json(
      { error: "visitorId and message are required" },
      { status: 400 }
    );
  }

  const context = await resolveSupportContext({
    pathname: body?.pathname,
    username: body?.username,
    bookingId: body?.bookingId,
    token: body?.token,
  });

  await connectDB();

  const conversation = await SupportConversation.findOneAndUpdate(
    { visitorId, scopeKey: context.scopeKey },
    {
      $setOnInsert: {
        visitorId,
      },
      $set: {
        ...supportContextToUpdate(context),
        unreadForAdmin: true,
        lastMessageAt: new Date(),
        lastMessagePreview: message.slice(0, 240),
      },
      $push: {
        messages: {
          senderRole: "customer",
          text: message,
          createdAt: new Date(),
        },
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  const adminUrl = new URL(
    `/admin/support?conversationId=${conversation._id.toString()}`,
    getSiteUrl()
  ).toString();

  try {
    await sendSmtpEmail({
      to: "support@lodday.com",
      subject: `Support chat: ${context.title || "New message"}`,
      html: renderSupportNotificationEmail({
        adminUrl,
        conversationId: conversation._id.toString(),
        context,
        message,
      }),
    });
  } catch (error) {
    console.error("support-notification-email", error);
  }

  return NextResponse.json({
    success: true,
    context,
    conversation: normalizeConversation(conversation.toObject()),
  });
}
