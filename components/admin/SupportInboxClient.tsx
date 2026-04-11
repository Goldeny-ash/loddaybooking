"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Send } from "lucide-react";

type SupportMessage = {
  id: string;
  senderRole: "customer" | "admin";
  text: string;
  createdAt: string;
};

type SupportConversation = {
  id: string;
  scopeType: "general" | "business" | "booking";
  pathname: string;
  bookingId: string | null;
  businessId: string | null;
  businessName: string;
  customerName: string;
  title: string;
  unreadForAdmin: boolean;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  messages: SupportMessage[];
};

function formatDateTime(value: string | null) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function scopeLabel(conversation: SupportConversation) {
  if (conversation.scopeType === "booking") return "Booking";
  if (conversation.scopeType === "business") return "Business";
  return "General";
}

export default function SupportInboxClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFromQuery = searchParams.get("conversationId");
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function loadConversations() {
    const response = await fetch("/api/admin/support/conversations", {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Failed to load support inbox.");
    }
    setConversations(data.conversations || []);
  }

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/support/conversations", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to load support inbox.");
        }
        if (active) {
          setConversations(data.conversations || []);
        }
      } catch (error) {
        if (active) {
          window.alert(error instanceof Error ? error.message : "Failed to load support inbox.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void run();

    const interval = window.setInterval(() => {
      void loadConversations();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const selectedConversation = useMemo(() => {
    if (selectedFromQuery) {
      return conversations.find((conversation) => conversation.id === selectedFromQuery) || null;
    }

    return conversations[0] || null;
  }, [conversations, selectedFromQuery]);

  useEffect(() => {
    if (!selectedConversation && conversations[0]) {
      router.replace(`/admin/support?conversationId=${conversations[0].id}`);
      return;
    }

    if (!selectedFromQuery && selectedConversation) {
      router.replace(`/admin/support?conversationId=${selectedConversation.id}`);
    }
  }, [conversations, router, selectedConversation, selectedFromQuery]);

  async function handleReply() {
    const trimmed = reply.trim();
    if (!trimmed || !selectedConversation || sending) return;

    setSending(true);
    try {
      const response = await fetch(
        `/api/admin/support/conversations/${selectedConversation.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: trimmed }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to send reply.");
      }

      setConversations((current) =>
        current.map((item) => (item.id === data.conversation.id ? data.conversation : item))
      );
      setReply("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
          <p className="text-sm text-slate-500">Customer messages from the floating support bubble.</p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Loading support inbox
            </div>
          ) : null}

          {!loading && !conversations.length ? (
            <div className="px-5 py-6 text-sm text-slate-500">No support conversations yet.</div>
          ) : null}

          {conversations.map((conversation) => {
            const active = conversation.id === selectedConversation?.id;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => router.replace(`/admin/support?conversationId=${conversation.id}`)}
                className={`w-full border-b border-slate-100 px-5 py-4 text-left transition ${
                  active ? "bg-slate-50" : "bg-white hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{conversation.title || "Support thread"}</p>
                  <span className="rounded-full bg-[#FFECD1] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#78290F]">
                    {scopeLabel(conversation)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{conversation.lastMessagePreview || "No messages yet."}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDateTime(conversation.lastMessageAt)}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">
            {selectedConversation?.title || "Support inbox"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {selectedConversation
              ? `${scopeLabel(selectedConversation)} conversation from ${selectedConversation.pathname}`
              : "Select a conversation to view the thread."}
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-6 py-6">
          {!selectedConversation ? (
            <div className="rounded-3xl bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
              No conversation selected.
            </div>
          ) : null}

          {selectedConversation?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderRole === "admin" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                  message.senderRole === "admin"
                    ? "rounded-br-md bg-[#15616D] text-white"
                    : "rounded-bl-md bg-white text-slate-700"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p
                  className={`mt-2 text-[11px] ${
                    message.senderRole === "admin" ? "text-white/70" : "text-slate-400"
                  }`}
                >
                  {formatDateTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleReply();
                }
              }}
              disabled={!selectedConversation || sending}
              placeholder="Reply from admin"
              className="min-h-[60px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#15616D] disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => void handleReply()}
              disabled={!selectedConversation || sending || !reply.trim()}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FE7F2D] text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send admin reply"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
