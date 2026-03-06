"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Heart, X } from "lucide-react";

type Theme = {
  primary: string;
  accent: string;
  primaryLight?: string;
  accentLight?: string;
  primaryDark?: string;
};

type PortfolioEntry = {
  _id: string;
  images?: Array<{
    url?: string;
    description?: string;
    dateDone?: string;
    totalCost?: number;
    likes?: number;
  }>;
};

type PortfolioCard = {
  id: string;
  refId: string;
  imageIndex: number;
  imageUrl: string;
  description: string;
  dateDone?: string;
  totalCost: number;
  likes: number;
};

function parseDateMs(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(dateDone?: string) {
  const ms = parseDateMs(dateDone);
  if (!ms) return "Recent work";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PortfolioShowcase({
  referenceImages,
  theme,
}: {
  referenceImages: PortfolioEntry[];
  theme: Theme;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [previewImage, setPreviewImage] = useState<PortfolioCard | null>(null);

  const cards = useMemo<PortfolioCard[]>(() => {
    const flat = referenceImages.flatMap((entry) =>
      (entry.images || [])
        .filter((img) => typeof img.url === "string" && img.url.trim())
        .map((img, index) => ({
          id: `${entry._id}-${index}`,
          refId: entry._id,
          imageIndex: index,
          imageUrl: String(img.url),
          description: String(img.description || "").trim(),
          dateDone: img.dateDone,
          totalCost: Number(img.totalCost || 0),
          likes: Number(img.likes || 0),
        }))
    );
    return flat.sort((a, b) => parseDateMs(b.dateDone) - parseDateMs(a.dateDone));
  }, [referenceImages]);

  if (!cards.length) return null;

  const titleText = theme?.primaryDark || theme?.primary || "#111827";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold" style={{ color: titleText }}>
          Look At Our Previous Work
        </h2>
        <p className="text-sm opacity-80" style={{ color: titleText }}>
          Browse our portfolio by scrolling sideways.
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
            return (
              <article
                key={card.id}
                className="group relative overflow-hidden rounded-2xl border shadow-lg w-[270px] h-[360px] shrink-0"
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

                <div className="absolute inset-x-0 bottom-0 z-20 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white">
                  <div className="flex items-center gap-1 text-xs opacity-90 mb-1">
                    <CalendarClock size={13} />
                    <span>{formatDate(card.dateDone)}</span>
                  </div>
                  <p className="text-xs font-semibold mb-1">Total Cost: KES {card.totalCost.toLocaleString()}</p>
                  <p className="text-sm leading-snug">{isExpanded ? card.description || "Portfolio work showcase." : shortText || "Portfolio work showcase."}</p>
                  {shouldTruncate && (
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
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {previewImage && (
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
      )}
    </section>
  );
}
