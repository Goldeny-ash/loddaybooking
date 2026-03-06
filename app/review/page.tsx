"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReviewForm from "@/components/reviews/ReviewForm";

function ReviewPageContent() {
  const params = useSearchParams();
  const bookingId = params.get("bookingId") || undefined;
  const token = params.get("token") || undefined;
  const type = params.get("type");
  const source = params.get("source");

  const defaultReviewType = type === "business" ? "business" : "platform";
  const resolvedSource =
    source === "home" || source === "manage" || source === "email" || source === "direct"
      ? source
      : "direct";

  return (
    <main className="min-h-screen bg-[linear-gradient(120deg,#FFECD1_0%,#C2E0E0_100%)] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-center font-serif text-4xl text-[#001524]">Leave a Review</h1>
        <p className="mb-8 text-center text-sm text-[#29454A]">
          Share feedback about the platform or your booking experience.
        </p>
        <ReviewForm
          bookingId={bookingId}
          token={token}
          source={resolvedSource}
          defaultReviewType={defaultReviewType}
        />
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[linear-gradient(120deg,#FFECD1_0%,#C2E0E0_100%)] px-4 py-12" />}>
      <ReviewPageContent />
    </Suspense>
  );
}
