"use client";

import { useEffect, useState } from "react";

import ThemedPopup from "@/components/ThemedPopup";

type Props = {
  business: {
    name?: string;
    access?: {
      status?: string;
    };
    marketplaceVisible?: boolean;
    marketplaceStatus?: "none" | "pending" | "approved" | "rejected";
    marketplaceRejectionReason?: string;
  };
};

type MarketplaceState = {
  marketplaceVisible: boolean;
  marketplaceStatus: "none" | "pending" | "approved" | "rejected";
  marketplaceRejectionReason: string;
};

function isActiveSubscription(status?: string) {
  return status === "ACTIVE";
}

export default function MarketplaceVisibilityManager({ business }: Props) {
  const [state, setState] = useState<MarketplaceState>({
    marketplaceVisible: Boolean(business.marketplaceVisible),
    marketplaceStatus: business.marketplaceStatus || "none",
    marketplaceRejectionReason: business.marketplaceRejectionReason || "",
  });
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  useEffect(() => {
    setState({
      marketplaceVisible: Boolean(business.marketplaceVisible),
      marketplaceStatus: business.marketplaceStatus || "none",
      marketplaceRejectionReason: business.marketplaceRejectionReason || "",
    });
  }, [business.marketplaceRejectionReason, business.marketplaceStatus, business.marketplaceVisible]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/dashboard/marketplace");
        const payload = await response.json();
        if (!response.ok || !payload.business) return;
        setState({
          marketplaceVisible: Boolean(payload.business.marketplaceVisible),
          marketplaceStatus: payload.business.marketplaceStatus || "none",
          marketplaceRejectionReason: payload.business.marketplaceRejectionReason || "",
        });
      } catch {
        // Keep initial state if refresh fails.
      }
    };

    load();
  }, []);

  const activeSubscription = isActiveSubscription(business.access?.status);

  const runAction = async (action: "request" | "toggle") => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setPopup({ message: payload.error || "Unable to update marketplace settings.", variant: "error" });
        return;
      }

      setState((current) => ({
        ...current,
        ...payload.business,
      }));
      setPopup({ message: payload.message || "Marketplace settings updated.", variant: "success" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ThemedPopup
        message={popup?.message || null}
        variant={popup?.variant || "success"}
        onClose={() => setPopup(null)}
      />

      <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#78290F]/60">
          Marketplace
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">Marketplace visibility</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Control whether {business.name || "your business"} can appear on Lodday Marketplace. Approved
          businesses can be discovered through marketplace search and category browsing.
        </p>

        {!activeSubscription ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Marketplace access is available on active subscriptions only.
          </div>
        ) : null}

        {activeSubscription ? (
          <div className="mt-6 rounded-2xl border border-black/5 bg-[#f8f4ee] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#111827]">Enable Marketplace Visibility</p>
                <p className="mt-1 text-sm text-slate-600">
                  {state.marketplaceStatus === "approved"
                    ? "Your business has been approved for marketplace visibility."
                    : state.marketplaceStatus === "pending"
                      ? "Your request is pending approval. You will be notified once reviewed."
                      : "Submit your business for marketplace approval before it becomes visible."}
                </p>
              </div>

              {state.marketplaceStatus === "approved" ? (
                <label className="inline-flex items-center gap-3 text-sm font-medium text-[#111827]">
                  <input
                    type="checkbox"
                    checked={state.marketplaceVisible}
                    onChange={() => runAction("toggle")}
                    disabled={loading}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                  {state.marketplaceVisible ? "Marketplace Visible" : "Marketplace Hidden"}
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => runAction("request")}
                  disabled={loading || state.marketplaceStatus === "pending"}
                  className="rounded-full bg-[#111827] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state.marketplaceStatus === "rejected" ? "Reapply for marketplace" : "Enable visibility"}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {state.marketplaceStatus === "rejected" && state.marketplaceRejectionReason ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Your request was not approved. Reason: {state.marketplaceRejectionReason}
          </div>
        ) : null}
      </div>
    </div>
  );
}
