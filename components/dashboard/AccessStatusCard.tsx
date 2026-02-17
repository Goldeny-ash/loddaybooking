"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import RenewSubscriptionModal from "@/components/dashboard/RenewSubscriptionModal";

interface AccessStatusCardProps {
  business: any;
  className?: string;
}

export default function AccessStatusCard({ business, className = "" }: AccessStatusCardProps) {
  const [openModal, setOpenModal] = useState(false);

  const access = business.access;
  const subscription = business.subscription;
  const now = new Date();

  // Trial logic
  const isTrial = access?.status === "TRIAL";
  const trialEndsAt = access?.trialEndsAt ? new Date(access.trialEndsAt) : null;
  const trialDaysLeft =
    isTrial && trialEndsAt
      ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // Subscription logic
  const subStatus = subscription?.status || "EXPIRED";
  const subExpiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;

  const isActive = subStatus === "ACTIVE";
  const isPending = subStatus === "PENDING";
  const isInactive = !isActive && !isTrial;

  return (
    <>
      <div
        className={`rounded-2xl shadow p-5 border ${className}`}
        style={{
          borderColor: isActive ? "var(--brand-primary)" : "red",
          backgroundColor: "var(--brand-bg-soft)",
        }}
      >
        {/* Header */}
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          {isTrial || isActive ? (
            <ShieldCheck className="text-[var(--brand-primary)]" size={18} />
          ) : (
            <ShieldAlert className="text-red-500" size={18} />
          )}
          Access Status
        </h3>

        {/* Status */}
        {isTrial && trialDaysLeft !== null && (
          <p className="text-lg font-semibold text-yellow-700">
            Trial Active — {trialDaysLeft} day{trialDaysLeft > 1 ? "s" : ""} left
          </p>
        )}
        {isActive && !isTrial && (
          <p className="text-lg font-semibold text-[var(--brand-primary-dark)]">Active Plan</p>
        )}
        {isPending && (
          <p className="text-lg font-semibold text-yellow-700">Pending Subscription</p>
        )}
        {isInactive && !isTrial && !isActive && (
          <p className="text-lg font-semibold text-red-600">Inactive</p>
        )}

        {/* Expiry Info */}
        {trialEndsAt && isTrial && (
          <p className="text-xs text-gray-500">Trial ends on {trialEndsAt.toLocaleDateString()}</p>
        )}
        {subExpiresAt && isActive && (
          <p className="text-xs text-gray-500">Subscription expires on {subExpiresAt.toLocaleDateString()}</p>
        )}

        {/* Action Buttons */}
        {(isInactive || !isActive) && (
          <button
            onClick={() => setOpenModal(true)}
            className="mt-3 w-full text-sm px-4 py-2 rounded bg-[var(--brand-primary)] text-white"
          >
            {isInactive ? "Start Trial or Subscribe" : "Manage Subscription"}
          </button>
        )}
      </div>

      {openModal && (
        <RenewSubscriptionModal
          businessId={business._id}
          onClose={() => setOpenModal(false)}
          onSuccess={() => setOpenModal(false)}
        />
      )}
    </>
  );
}
