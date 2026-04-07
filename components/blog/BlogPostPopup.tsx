"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  popup: {
    enabled: boolean;
    headline: string;
    subheadline: string;
    label: string;
    href: string;
    image: string;
    trigger: "scroll" | "bottom";
  };
};

export default function BlogPostPopup({ popup }: Props) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const popupKey = useMemo(() => `${popup.href}:${popup.headline}:${popup.trigger}`, [popup.href, popup.headline, popup.trigger]);

  useEffect(() => {
    setOpen(false);
    setDismissed(false);
  }, [popupKey]);

  useEffect(() => {
    if (!popup.enabled || !popup.headline || !popup.label || !popup.href || dismissed) return;
    if (typeof window === "undefined") return;

    if (popup.trigger === "bottom") {
      const onScroll = () => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.body.offsetHeight;
        if (scrollPosition >= documentHeight - 120) {
          setOpen(true);
          window.removeEventListener("scroll", onScroll);
        }
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const timer = window.setTimeout(() => setOpen(true), 5000);
    return () => window.clearTimeout(timer);
  }, [popup.enabled, popup.headline, popup.label, popup.href, popup.trigger, dismissed]);

  if (!popup.enabled || !popup.headline || !popup.label || !popup.href || !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setOpen(false);
          }}
          className="absolute right-4 top-4 rounded-full bg-black/5 px-3 py-2 text-sm font-semibold text-slate-600"
        >
          Close
        </button>

        {popup.image ? <img src={popup.image} alt={popup.headline} className="h-44 w-full object-cover" loading="lazy" /> : null}

        <div className="space-y-4 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15616D]">Lodday updates</p>
          <h3 className="text-2xl font-semibold text-slate-900">{popup.headline}</h3>
          {popup.subheadline ? <p className="text-sm leading-7 text-slate-600">{popup.subheadline}</p> : null}
          <a
            href={popup.href}
            className="inline-flex rounded-full bg-[#15616D] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => setDismissed(true)}
          >
            {popup.label}
          </a>
        </div>
      </div>
    </div>
  );
}
