"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Clock3, Heart, X } from "lucide-react";

import ServiceModal from "./ServiceModal";
import type { AddOn, Service, Theme } from "@/components/public/PublicBookingPageClient";

interface AddToSummaryPayload {
  service: Service;
  selectedRefs: string[];
  isMobile: boolean;
  selectedAddOns?: AddOn[];
  selectedSessions?: { sessions: number; price: number; durationMinutes?: number }[];
  selectedAreas?: { area: string; min?: number; max?: number; price?: number }[];
  selectedTier?: { label: string; min?: number; max?: number; price?: number } | null;
  price?: number;
  durationMinutes?: number;
  depositAmount?: number;
}

type PortfolioEntry = {
  _id: string;
  linkedServiceIds?: string[];
  images?: Array<{
    _id?: string;
    url?: string;
    description?: string;
    totalCost?: number;
    durationMinutes?: number;
    priceBreakdown?: string;
    likes?: number;
  }>;
};

type PortfolioCard = {
  id: string;
  refId: string;
  linkedServiceIds: string[];
  imageIndex: number;
  imageId?: string;
  imageUrl: string;
  gallery: string[];
  description: string;
  totalCost: number;
  durationMinutes: number;
  priceBreakdown: string;
  likes: number;
};

function formatDurationMinutes(value?: number) {
  const minutes = Number(value || 0);
  if (!minutes) return "Duration on request";
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hour${hours === 1 ? "" : "s"}` : `${hours.toFixed(1)} hrs`;
}

export default function PortfolioShowcase({
  referenceImages,
  services,
  theme,
  username,
  onAddToSummary,
}: {
  referenceImages: PortfolioEntry[];
  services: Service[];
  theme: Theme;
  username: string;
  onAddToSummary: (data: AddToSummaryPayload) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [previewImage, setPreviewImage] = useState<PortfolioCard | null>(null);
  const [bookStyle, setBookStyle] = useState<Service | null>(null);

  const cards = useMemo<PortfolioCard[]>(() => {
    return referenceImages.flatMap((entry) => {
      const gallery = (entry.images || [])
        .map((img) => String(img.url || "").trim())
        .filter(Boolean);

      return (entry.images || [])
        .filter((img) => typeof img.url === "string" && img.url.trim())
        .map((img, index) => ({
          id: `${entry._id}-${index}`,
          refId: entry._id,
          linkedServiceIds: (entry.linkedServiceIds || []).map((id) => String(id)),
          imageIndex: index,
          imageId: img._id,
          imageUrl: String(img.url),
          gallery,
          description: String(img.description || "").trim(),
          totalCost: Number(img.totalCost || 0),
          durationMinutes: Number(img.durationMinutes || 0),
          priceBreakdown: String(img.priceBreakdown || "").trim(),
          likes: Number(img.likes || 0),
        }));
    });
  }, [referenceImages]);

  if (!cards.length) return null;

  const titleText = theme?.primaryDark || theme?.primary || "#111827";

  const openBookStyle = (card: PortfolioCard) => {
    const linkedService = services.find((service) => card.linkedServiceIds.includes(service._id));
    if (!linkedService) return;

    setBookStyle({
      ...linkedService,
      name: linkedService.name,
      gallery: card.gallery.length ? card.gallery : [card.imageUrl],
      basePrice: card.totalCost > 0 ? card.totalCost : linkedService.basePrice,
      durationMinutes: card.durationMinutes > 0 ? card.durationMinutes : linkedService.durationMinutes,
      description: card.description || linkedService.description,
      priceBreakdown: card.priceBreakdown,
      portfolioBooking: {
        refId: card.refId,
        imageId: card.imageId,
        imageIndex: card.imageIndex,
        exactStyle: true,
      },
      username,
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold" style={{ color: titleText }}>
          Look At Our Previous Work
        </h2>
        <p className="text-sm opacity-80" style={{ color: titleText }}>
          Browse our portfolio and book the exact style you want.
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {cards.map((card) => {
            const isExpanded = Boolean(expanded[card.id]);
            const isLiked = Boolean(liked[card.id]);
            const count = likeCounts[card.id] ?? card.likes;
            const shouldTruncate = card.description.length > 110;
            const shortText = shouldTruncate ? `${card.description.slice(0, 110)}...` : card.description;
            const hasLinkedService = services.some((service) => card.linkedServiceIds.includes(service._id));

            return (
              <article
                key={card.id}
                className="group relative overflow-hidden rounded-2xl border shadow-lg w-[290px] h-[430px] shrink-0"
                style={{
                  borderColor: `${theme.primary}33`,
                  background: `linear-gradient(180deg, ${theme.primaryLight || "#f3f4f6"} 0%, ${theme.accentLight || "#e5e7eb"} 100%)`,
                }}
              >
                <button
                  type="button"
                  className="absolute inset-0 z-10"
                  onClick={() => setPreviewImage(card)}
                  aria-label="Open portfolio image"
                />

                <img
                  src={card.imageUrl}
                  alt="Portfolio work"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const nextLiked = !isLiked;
                    const delta = nextLiked ? 1 : -1;
                    setLiked((prev) => ({ ...prev, [card.id]: nextLiked }));
                    setLikeCounts((prev) => {
                      const current = prev[card.id] ?? card.likes;
                      return { ...prev, [card.id]: Math.max(current + delta, 0) };
                    });

                    try {
                      const res = await fetch(`/api/portfolio/${card.refId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          imageIndex: card.imageIndex,
                          delta,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Failed to save like");
                      setLikeCounts((prev) => ({ ...prev, [card.id]: Number(data.likes || 0) }));
                    } catch {
                      setLiked((prev) => ({ ...prev, [card.id]: isLiked }));
                      setLikeCounts((prev) => {
                        const current = prev[card.id] ?? card.likes;
                        return { ...prev, [card.id]: Math.max(current - delta, 0) };
                      });
                    }
                  }}
                  className="absolute top-3 right-3 z-20 grid h-9 w-9 place-items-center rounded-full border backdrop-blur-sm"
                  style={{
                    borderColor: `${theme.accent}55`,
                    backgroundColor: "rgba(0,0,0,0.35)",
                  }}
                >
                  <Heart size={16} fill={isLiked ? theme.accent : "transparent"} color={isLiked ? theme.accent : "#ffffff"} />
                </button>

                <div className="absolute top-3 left-3 z-20 rounded-full px-2 py-1 text-xs font-medium text-white bg-black/40 backdrop-blur-sm">
                  {count} {count === 1 ? "like" : "likes"}
                </div>

                <div className="absolute inset-x-0 bottom-0 z-20 p-3 bg-gradient-to-t from-black/85 via-black/65 to-transparent text-white">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-xs opacity-90">
                      <Clock3 size={13} />
                      <span>{formatDurationMinutes(card.durationMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs opacity-90">
                      <CalendarClock size={13} />
                      <span>KES {card.totalCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-sm leading-snug">{isExpanded ? card.description || "Portfolio work showcase." : shortText || "Portfolio work showcase."}</p>
                  {shouldTruncate ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((prev) => ({ ...prev, [card.id]: !prev[card.id] }));
                      }}
                      className="mt-1 text-xs font-semibold underline underline-offset-2"
                      style={{ color: theme.accentLight || "#c7d2fe" }}
                    >
                      {isExpanded ? "See less" : "See more details"}
                    </button>
                  ) : null}

                  {card.priceBreakdown ? (
                    <p className="mt-2 whitespace-pre-line text-[11px] leading-5 text-white/85">
                      {card.priceBreakdown}
                    </p>
                  ) : null}

                  {hasLinkedService ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openBookStyle(card);
                      }}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                    >
                      Book This Style
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-2xl overflow-hidden border"
            style={{ borderColor: `${theme.primary}66` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 rounded-full p-2 bg-black/60 text-white"
            >
              <X size={18} />
            </button>
            <img src={previewImage.imageUrl} alt="Portfolio full view" className="w-full max-h-[80vh] object-contain bg-black" />
          </div>
        </div>
      ) : null}

      {bookStyle ? (
        <ServiceModal
          service={bookStyle}
          theme={theme}
          onClose={() => setBookStyle(null)}
          onAddToSummary={(data) => {
            onAddToSummary(data);
            setBookStyle(null);
          }}
          username={username}
        />
      ) : null}
    </section>
  );
}
