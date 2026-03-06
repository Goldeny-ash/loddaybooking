"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck, X } from "lucide-react";
import SubscriptionManagerClient from "@/components/dashboard/SubscriptionManagerClient";
import { getTheme } from "@/lib/theme";

interface AccessStatusCardProps {
  business: {
    _id?: string;
    access?: {
      status?: string;
      trialEndsAt?: string;
      subscriptionExpiresAt?: string;
      nextChargeAt?: string;
    };
  };
  className?: string;
}

export default function AccessStatusCard({
  business,
  className = "",
}: AccessStatusCardProps) {
  const [openModal, setOpenModal] = useState(false);
  const theme = getTheme(business || {});
  const access = business?.access || {};
  const now = new Date();

  const status = String(access.status || "INACTIVE").toUpperCase();
  const trialEndsAt = access.trialEndsAt ? new Date(access.trialEndsAt) : null;
  const subExpiresAt = access.subscriptionExpiresAt
    ? new Date(access.subscriptionExpiresAt)
    : null;

  const trialDaysLeft =
    status === "TRIAL" && trialEndsAt
      ? Math.max(
          Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          0
        )
      : null;

  const state = useMemo(() => {
    if (status === "ACTIVE") return "ACTIVE";
    if (status === "TRIAL") return "TRIAL";
    if (status === "GRACE") return "GRACE";
    if (status === "PENDING") return "PENDING";
    return "INACTIVE";
  }, [status]);

  const isHealthy = state === "ACTIVE" || state === "TRIAL";

  return (
    <>
      <div
        className={`rounded-2xl shadow p-5 border ${className}`}
        style={{
          borderColor: isHealthy ? "var(--brand-primary)" : "#dc2626",
          backgroundColor: "var(--brand-bg-soft)",
        }}
      >
        <h3
          className="font-semibold flex items-center gap-2 mb-2"
          style={{ color: "var(--brand-primary-dark)" }}
        >
          {isHealthy ? (
            <ShieldCheck className="text-[var(--brand-primary)]" size={18} />
          ) : (
            <ShieldAlert className="text-red-500" size={18} />
          )}
          Access Status
        </h3>

        {state === "TRIAL" && (
          <p className="text-lg font-semibold text-yellow-700">
            Trial Active - {trialDaysLeft ?? 0} day{(trialDaysLeft ?? 0) === 1 ? "" : "s"} left
          </p>
        )}
        {state === "ACTIVE" && (
          <p className="text-lg font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
            Active Plan
          </p>
        )}
        {state === "GRACE" && <p className="text-lg font-semibold text-orange-600">Grace Period</p>}
        {state === "PENDING" && (
          <p className="text-lg font-semibold text-yellow-700">Payment Pending</p>
        )}
        {state === "INACTIVE" && (
          <p className="text-lg font-semibold text-red-600">Inactive</p>
        )}

        {trialEndsAt && state === "TRIAL" && (
          <p className="text-xs text-gray-500">Trial ends on {trialEndsAt.toLocaleDateString()}</p>
        )}
        {subExpiresAt && state === "ACTIVE" && (
          <p className="text-xs text-gray-500">
            Subscription expires on {subExpiresAt.toLocaleDateString()}
          </p>
        )}
        {access.nextChargeAt && state === "ACTIVE" && (
          <p className="text-xs text-gray-500">
            Next billing on {new Date(access.nextChargeAt).toLocaleDateString()}
          </p>
        )}

        <button
          onClick={() => setOpenModal(true)}
          className="mt-3 w-full text-sm px-4 py-2 rounded text-white"
          style={{ backgroundColor: theme.primary }}
        >
          Manage Subscription
        </button>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm p-4 md:p-8">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-white p-5 md:p-6 shadow-2xl relative">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute right-4 top-4 rounded-full border p-1"
              style={{ borderColor: theme.primaryLight, color: theme.primaryDark }}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <SubscriptionManagerClient
              business={business}
              asPopup
              onClose={() => setOpenModal(false)}
              subscription={{
                status: state,
                nextChargeAt: access.nextChargeAt,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
