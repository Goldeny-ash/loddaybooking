"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";
import ReviewForm from "@/components/reviews/ReviewForm";

interface ReviewItem {
  id: string;
  reviewType: "platform" | "business";
  rating: number;
  comment: string;
  displayName: string;
  avatarKind: string;
  avatarValue: string;
  avatarImageUrl: string;
  business: {
    id: string;
    name: string;
    username: string;
    logo: string;
  } | null;
}

const CARD_BACKGROUNDS = [
  "linear-gradient(135deg, #FFF4E1 0%, #FFECD1 100%)",
  "linear-gradient(135deg, #C2E0E0 0%, #E0F0F0 100%)",
  "linear-gradient(135deg, #FEE7D3 0%, #FFD9BC 100%)",
  "linear-gradient(135deg, #EAE3D8 0%, #F5EFE5 100%)",
];

function initialsFrom(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "RV";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((x) => x[0]?.toUpperCase() || "").join("") || "RV";
}

function FallbackAvatar({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-[#15616D] text-white">
      <span className="text-xs font-bold">{initialsFrom(name)}</span>
      <span className="text-[8px] leading-none opacity-85">{label.slice(0, 3).toUpperCase()}</span>
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews?scope=all&limit=30");
      const data = await res.json();
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const marqueeItems = useMemo(() => {
    if (!reviews.length) return [];
    return [...reviews, ...reviews];
  }, [reviews]);

  return (
    <section className="relative overflow-hidden rounded-t-[88px] bg-[#E9DFD2] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h2 className="font-serif text-4xl text-[#1A1A1A]">What Others Have To Say</h2>
            <p className="mt-2 text-sm text-[#3D3D3D]">Platform and business reviews from your community.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-[#15616D] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
          >
            {showForm ? "Hide Review Form" : "Leave Review"}
          </button>
        </div>

        {showForm && (
          <div className="mb-12">
            <ReviewForm
              source="home"
              defaultReviewType="platform"
              onSubmitted={() => {
                setShowForm(false);
                loadReviews();
              }}
            />
          </div>
        )}

        {loading && <p className="text-center text-sm text-[#3D3D3D]">Loading reviews...</p>}

        {!loading && reviews.length === 0 && (
          <div className="rounded-3xl border border-white/40 bg-white/55 p-8 text-center text-[#3D3D3D]">
            No reviews yet. Be the first to leave one.
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="space-y-5">
            {[0, 1].map((row) => (
              <div key={row} className="relative overflow-hidden">
                <motion.div
                  className="flex w-max gap-4"
                  animate={{ x: row === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
                  transition={{ duration: row === 0 ? 24 : 30, repeat: Infinity, ease: "linear" }}
                >
                  {marqueeItems.map((review, idx) => (
                    <article
                      key={`${review.id}-${row}-${idx}`}
                      className="flex h-[138px] w-[360px] flex-shrink-0 items-start gap-3 rounded-full border border-white/60 px-5 py-4 shadow-xl"
                      style={{ background: CARD_BACKGROUNDS[idx % CARD_BACKGROUNDS.length] }}
                    >
                      {review.avatarImageUrl ? (
                        <Image
                          src={review.avatarImageUrl}
                          alt={review.displayName}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full border border-white/70 object-cover"
                        />
                      ) : (
                        <FallbackAvatar name={review.displayName} label={review.avatarValue || review.avatarKind} />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[#1A1A1A]">{review.displayName}</p>
                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#333]">
                            {review.reviewType === "platform" ? "Platform" : review.business?.name || "Business"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`h-3.5 w-3.5 ${n <= review.rating ? "fill-amber-400 text-amber-500" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#2C2C2C]">{review.comment || "Great experience."}</p>
                      </div>
                    </article>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
