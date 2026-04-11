import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await requirePlatformOwner();
    const { conversationId } = await params;
    const body = await req.json();
    const message = String(body?.message || "").trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });
    }

    await connectDB();

    const conversation = await SupportConversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          unreadForVisitor: true,
          unreadForAdmin: false,
          lastMessageAt: new Date(),
          lastMessagePreview: message.slice(0, 240),
        },
        $push: {
          messages: {
            senderRole: "admin",
            text: message,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: normalizeConversation(conversation.toObject()),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
