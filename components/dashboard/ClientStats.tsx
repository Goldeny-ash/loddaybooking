"use client";

export type ClientStatItem = {
  key: string;
  title: string;
  subtitle: string;
  countLabel: string;
  revenueLabel: string;
  confidenceLabel: string;
  questionLabel: string;
  tone: "success" | "warning" | "danger" | "neutral";
  onClick?: () => void;
};

const TONE_STYLES: Record<ClientStatItem["tone"], { border: string; accent: string; badgeBg: string; badgeColor: string; background: string; }> = {
  success: {
    border: "rgba(34,197,94,0.28)",
    accent: "#166534",
    badgeBg: "rgba(34,197,94,0.12)",
    badgeColor: "#166534",
    background:
      "linear-gradient(180deg, rgba(240,253,244,0.92) 0%, rgba(255,255,255,0.98) 100%)",
  },
  warning: {
    border: "rgba(245,158,11,0.28)",
    accent: "#b45309",
    badgeBg: "rgba(245,158,11,0.12)",
    badgeColor: "#b45309",
    background:
      "linear-gradient(180deg, rgba(255,251,235,0.92) 0%, rgba(255,255,255,0.98) 100%)",
  },
  danger: {
    border: "rgba(239,68,68,0.28)",
    accent: "#b91c1c",
    badgeBg: "rgba(239,68,68,0.12)",
    badgeColor: "#b91c1c",
    background:
      "linear-gradient(180deg, rgba(254,242,242,0.94) 0%, rgba(255,255,255,0.98) 100%)",
  },
  neutral: {
    border: "var(--brand-primary-light)",
    accent: "var(--brand-primary-dark)",
    badgeBg: "rgba(15,23,42,0.06)",
    badgeColor: "var(--brand-primary-dark)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, var(--brand-bg-soft) 100%)",
  },
};

export default function ClientStats({ items }: { items: ClientStatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {items.map((item) => {
        const tone = TONE_STYLES[item.tone];

        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="h-full min-w-0 text-left"
          >
            <div
              className="flex h-full min-w-0 flex-col rounded-[1.75rem] border p-4 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 sm:p-5"
              style={{
                borderColor: tone.border,
                background: tone.background,
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.24em]"
                    style={{ color: "var(--brand-accent-dark)" }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="mt-3 text-xs leading-5 sm:text-sm sm:leading-6"
                    style={{ color: "var(--brand-accent-dark)" }}
                  >
                    {item.subtitle}
                  </p>
                </div>
                <span
                  className="inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.16em]"
                  style={{ background: tone.badgeBg, color: tone.badgeColor }}
                >
                  {item.confidenceLabel}
                </span>
              </div>

              <div className="mt-6">
                <p
                  className="text-xs font-medium sm:text-sm"
                  style={{ color: "var(--brand-accent-dark)" }}
                >
                  {item.countLabel}
                </p>
                <p
                  className="mt-2 break-words text-xl font-semibold sm:text-3xl"
                  style={{ color: tone.accent }}
                >
                  {item.revenueLabel}
                </p>
              </div>

              
            </div>
          </button>
        );
      })}
    </div>
  );
}
