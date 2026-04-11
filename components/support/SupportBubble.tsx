"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2, MessageCircleMore, Send, X } from "lucide-react";

type SupportMessage = {
  id: string;
  senderRole: "customer" | "admin";
  text: string;
  createdAt: string;
};

type SupportConversation = {
  id: string;
  title: string;
  messages: SupportMessage[];
};

type SupportContext = {
  type: "general" | "business" | "booking";
  greeting: string;
  pathname: string;
  scopeKey: string;
  title: string;
  businessId: string | null;
  businessName: string;
  bookingId: string | null;
  customerName: string;
};

const VISITOR_KEY = "lodday_support_visitor_id";

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(VISITOR_KEY, generated);
  return generated;
}

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function SupportBubble() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visitorId, setVisitorId] = useState("");
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<SupportContext | null>(null);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bookingId = searchParams.get("bookingId");
  const token = searchParams.get("token");

  const username = useMemo(() => {
    if (!pathname?.startsWith("/b/")) return "";
    const parts = pathname.split("/").filter(Boolean);
    return parts[1] || "";
  }, [pathname]);

  const contextQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("pathname", pathname || "/");
    if (username) params.set("username", username);
    if (bookingId) params.set("bookingId", bookingId);
    if (token) params.set("token", token);
    return params.toString();
  }, [bookingId, pathname, token, username]);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      setLoading(true);
      try {
        const response = await fetch(`/api/support/context?${contextQuery}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (active) {
          setContext(data.context);
        }
      } catch {
        if (active) {
          setContext(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, [contextQuery]);

  useEffect(() => {
    if (!visitorId || !contextQuery) return;

    let active = true;

    async function loadConversation() {
      try {
        const response = await fetch(
          `/api/support/conversations?visitorId=${encodeURIComponent(visitorId)}&${contextQuery}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (!active) return;
        if (data.context) setContext(data.context);
        setConversation(data.conversation);
      } catch {
        if (active) setConversation(null);
      }
    }

    void loadConversation();

    const interval = window.setInterval(() => {
      void loadConversation();
    }, open ? 8000 : 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [contextQuery, open, visitorId]);

  async function handleSend() {
    const trimmed = message.trim();
    if (!trimmed || !visitorId || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/support/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId,
          message: trimmed,
          pathname: pathname || "/",
          username: username || undefined,
          bookingId: bookingId || undefined,
          token: token || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to send support message.");
      }

      setConversation(data.conversation);
      setContext(data.context);
      setMessage("");
      setOpen(true);
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "Failed to send support message.";
      window.alert(nextMessage);
    } finally {
      setSending(false);
    }
  }

  const greeting = context?.greeting || "Hey, how can we help you?";
  const helperCopy =
    context?.type === "booking"
      ? "Ask anything about this booking and we’ll pick it up in support."
      : context?.type === "business"
        ? "Send us a message and we’ll continue the conversation from support."
        : "Send us a message and we’ll get back to you from support.";

  return (
    <div className="fixed bottom-4 right-4 z-[80]">
      {open ? (
        <div className="flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[28px] border border-[#001524]/10 bg-white shadow-[0_20px_60px_rgba(0,21,36,0.18)]">
          <div className="flex items-start justify-between gap-3 bg-[#15616D] px-5 py-4 text-white">
            <div>
              <p className="text-lg font-semibold">{greeting}</p>
              <p className="mt-1 text-sm text-white/80">{helperCopy}</p>
            </div>
            <button
              type="button"
              aria-label="Close support chat"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] px-4 py-4">
            {!conversation?.messages?.length ? (
              <div className="max-w-[85%] rounded-3xl rounded-bl-md bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                {greeting}
              </div>
            ) : null}

            {conversation?.messages?.map((item) => (
              <div
                key={item.id}
                className={`flex ${item.senderRole === "customer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                    item.senderRole === "customer"
                      ? "rounded-br-md bg-[#15616D] text-white"
                      : "rounded-bl-md bg-white text-slate-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{item.text}</p>
                  <p
                    className={`mt-2 text-[11px] ${
                      item.senderRole === "customer" ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {formatTime(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex items-center gap-2 px-2 text-sm text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Loading support
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Type your message"
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#15616D]"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !message.trim()}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FE7F2D] text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send support message"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#15616D] text-white shadow-[0_16px_40px_rgba(21,97,109,0.35)] transition hover:scale-105"
          aria-label="Open support chat"
        >
          <MessageCircleMore size={28} />
        </button>
      )}
    </div>
  );
}
