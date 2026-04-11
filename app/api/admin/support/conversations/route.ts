import { NextResponse } from "next/server";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { connectDB } from "@/lib/mongoDB";
import SupportConversation from "@/lib/models/SupportConversation";

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

export async function GET() {
  try {
    await requirePlatformOwner();
    await connectDB();

    const conversations = await SupportConversation.find({})
      .sort({ lastMessageAt: -1 })
      .lean();

    await SupportConversation.updateMany(
      { unreadForAdmin: true },
      { $set: { unreadForAdmin: false } }
    );

    return NextResponse.json({
      conversations: conversations.map((conversation) =>
        normalizeConversation({ ...conversation, unreadForAdmin: false })
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
