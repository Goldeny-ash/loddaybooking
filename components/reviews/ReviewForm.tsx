"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";
import StarRatingInput from "@/components/reviews/StarRatingInput";

type ReviewType = "platform" | "business";
type AvatarKind = "logo" | "photo" | "animal" | "element" | "initials";

interface ReviewFormProps {
  bookingId?: string;
  token?: string;
  source?: "home" | "manage" | "email" | "direct";
  defaultReviewType?: ReviewType;
  className?: string;
  onSubmitted?: () => void;
}

interface ReviewContextResponse {
  booking: {
    bookingId: string;
    customerName: string;
    businessId: string;
    businessName: string;
    businessUsername: string;
    businessLogo: string;
  } | null;
  loggedBusiness: {
    id: string;
    name: string;
    username: string;
    logo: string;
  } | null;
}

const ANIMAL_CHOICES = ["Lion", "Fox", "Eagle", "Wolf", "Dolphin"];
const ELEMENT_CHOICES = ["Fire", "Water", "Air", "Earth", "Lightning"];

function initialsFrom(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "RV";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((x) => x[0]?.toUpperCase() || "").join("") || "RV";
}

function labelForAvatar(kind: AvatarKind, value: string) {
  if (kind === "animal") return `Animal: ${value || "Lion"}`;
  if (kind === "element") return `Element: ${value || "Fire"}`;
  if (kind === "logo") return "Business Logo";
  if (kind === "photo") return "Uploaded Photo";
  return "Initials";
}

export default function ReviewForm({
  bookingId,
  token,
  source = "direct",
  defaultReviewType = "platform",
  className = "",
  onSubmitted,
}: ReviewFormProps) {
  const [loadingContext, setLoadingContext] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [reviewType, setReviewType] = useState<ReviewType>(defaultReviewType);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessUsername, setBusinessUsername] = useState("");
  const [businessLogo, setBusinessLogo] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [avatarKind, setAvatarKind] = useState<AvatarKind>("initials");
  const [avatarValue, setAvatarValue] = useState("Lion");

  useEffect(() => {
    let mounted = true;

    const params = new URLSearchParams();
    if (bookingId) params.set("bookingId", bookingId);
    if (token) params.set("token", token);

    fetch(`/api/reviews/context?${params.toString()}`)
      .then((r) => r.json())
      .then((data: ReviewContextResponse) => {
        if (!mounted) return;

        const fromBooking = data.booking;
        const fromBusiness = data.loggedBusiness;

        if (fromBooking) {
          setReviewType("business");
          setReviewerName(fromBooking.customerName || "");
          setBusinessId(fromBooking.businessId || "");
          setBusinessName(fromBooking.businessName || "");
          setBusinessUsername(fromBooking.businessUsername || "");
          setBusinessLogo(fromBooking.businessLogo || "");
          if (fromBooking.businessLogo) setAvatarKind("logo");
        } else if (fromBusiness) {
          setReviewerName(fromBusiness.name || "");
          setBusinessId(fromBusiness.id || "");
          setBusinessName(fromBusiness.name || "");
          setBusinessUsername(fromBusiness.username || "");
          setBusinessLogo(fromBusiness.logo || "");
          if (fromBusiness.logo) setAvatarKind("logo");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingContext(false);
      });

    return () => {
      mounted = false;
    };
  }, [bookingId, token]);

  const canUseLogo = !!businessLogo;
  const avatarPreviewLabel = useMemo(() => labelForAvatar(avatarKind, avatarValue), [avatarKind, avatarValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      reviewType,
      rating,
      comment,
      reviewerName,
      isAnonymous,
      bookingId,
      token,
      source,
      businessId,
      businessName,
      businessUsername,
      photoUrls,
      avatarKind,
      avatarValue,
      avatarImageUrl:
        avatarKind === "logo"
          ? businessLogo
          : avatarKind === "photo"
          ? photoUrls[0] || ""
          : "",
    };

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }
      setSubmitted(true);
      onSubmitted?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit review.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 ${className}`}>
        <p className="text-lg font-semibold">Thanks for your review.</p>
        <p className="text-sm opacity-80">Your feedback helps improve the platform and service quality.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 rounded-3xl border border-[#15616D]/20 bg-white/90 p-6 shadow-xl ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setReviewType("platform")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${reviewType === "platform" ? "bg-[#15616D] text-white" : "bg-[#FFF4E1] text-[#15616D]"}`}
        >
          Review Platform
        </button>
        <button
          type="button"
          onClick={() => setReviewType("business")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${reviewType === "business" ? "bg-[#78290F] text-white" : "bg-[#FFECD1] text-[#78290F]"}`}
        >
          Review Business
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Star Rating</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Your Name</label>
          <input
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Name shown on review"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#15616D]"
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          Post as anonymous
        </label>
      </div>

      {reviewType === "business" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Business Name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business being reviewed"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#15616D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Business Username</label>
            <input
              value={businessUsername}
              onChange={(e) => setBusinessUsername(e.target.value)}
              placeholder="Required if business is not auto-detected"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#15616D]"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience."
          rows={4}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#15616D]"
        />
      </div>

      <div className="rounded-2xl border border-[#15616D]/20 bg-[#FFF4E1]/60 p-4">
        <p className="mb-2 text-sm font-semibold text-[#001524]">Photos (Optional)</p>
        <p className="mb-3 text-xs text-gray-600">
          Upload up to 6 images. The first image may be used as your review pill avatar on the home page.
        </p>
        <ImageUpload value={photoUrls} onChange={setPhotoUrls} maxFiles={6} uploadPreset="business_logos" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-800">Avatar Style</p>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={avatarKind}
            onChange={(e) => setAvatarKind(e.target.value as AvatarKind)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="initials">Initials</option>
            {canUseLogo && <option value="logo">Business Logo</option>}
            <option value="photo">First Uploaded Photo</option>
            <option value="animal">Animal Avatar</option>
            <option value="element">Element Avatar</option>
          </select>

          {(avatarKind === "animal" || avatarKind === "element") && (
            <select
              value={avatarValue}
              onChange={(e) => setAvatarValue(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {(avatarKind === "animal" ? ANIMAL_CHOICES : ELEMENT_CHOICES).map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-2">
          {avatarKind === "logo" && businessLogo ? (
            <Image src={businessLogo} alt="Business logo avatar" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
          ) : avatarKind === "photo" && photoUrls[0] ? (
            <Image src={photoUrls[0]} alt="Photo avatar preview" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#15616D] text-sm font-bold text-white">
              {initialsFrom(isAnonymous ? "Anonymous" : reviewerName)}
            </div>
          )}
          <p className="text-sm text-gray-700">{avatarPreviewLabel}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || loadingContext}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#15616D] px-5 py-3 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {(submitting || loadingContext) && <Loader2 className="h-4 w-4 animate-spin" />}
        {loadingContext ? "Preparing form..." : submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
