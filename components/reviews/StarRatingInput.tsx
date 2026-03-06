"use client";

import { Star } from "lucide-react";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

export default function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
          className="rounded-md p-1 transition hover:scale-105"
        >
          <Star
            className={`h-6 w-6 ${star <= value ? "fill-amber-400 text-amber-500" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

