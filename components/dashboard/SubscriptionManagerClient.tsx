"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { getTheme } from "@/lib/theme";

type SubscriptionInfo = {
  status?: string;
  nextChargeAt?: string;
  paymentMethod?: string;
};

export default function SubscriptionManagerClient({
  business,
  subscription,
  asPopup = false,
  onClose,
}: {
  business?: unknown;
  subscription?: SubscriptionInfo;
  asPopup?: boolean;
  onClose?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [liveSubscription, setLiveSubscription] = useState<SubscriptionInfo | undefined>(
    subscription
  );
  const theme = getTheme(business || {});
  const current = liveSubscription || subscription;

  useEffect(() => {
    if (subscription) return;
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/subscription/current", { cache: "no-store" });
        const data = await res.json();
        if (mounted) setLiveSubscription(data.subscription || undefined);
      } catch {
        // ignore load failure in UI
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [subscription]);

  const cancelSubscription = async () => {
    if (!confirm("Cancel your subscription?")) return;
    try {
      setLoading(true);
      await axios.post("/api/subscription/cancel");
      alert("Subscription cancelled.");
      window.location.reload();
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Cancel failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const renewSubscription = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/subscription/start", {
        phoneNumber,
        affiliateCode: affiliateCode || undefined,
      });
      if (!res.data?.success) throw new Error("Failed");
      window.location.href = "/subscription/success";
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Renewal failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${asPopup ? "w-full max-w-2xl" : "max-w-3xl mx-auto"} space-y-6`}>
      <div
        className="rounded-xl border p-6 space-y-3"
        style={{
          borderColor: "var(--brand-primary-light)",
          backgroundColor: "var(--brand-bg-soft)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
            Current Plan
          </h2>
          {asPopup && onClose ? (
            <button
              onClick={onClose}
              className="px-3 py-1 rounded border text-sm"
              style={{ borderColor: theme.primaryLight, color: theme.primaryDark }}
            >
              Close
            </button>
          ) : null}
        </div>

        <p>
          <strong>Status:</strong> {current?.status || "Inactive"}
        </p>
        <p>
          <strong>Plan:</strong> KES 600 Monthly (STK Push)
        </p>
        <p>
          <strong>Next Billing:</strong>{" "}
          {current?.nextChargeAt ? new Date(current.nextChargeAt).toDateString() : "-"}
        </p>
        <p>
          <strong>Payment Method:</strong> M-Pesa STK
        </p>

        <input
          placeholder="M-Pesa phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          placeholder="Affiliate code (optional)"
          value={affiliateCode}
          onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
          className="border rounded px-3 py-2 w-full"
        />

        <Button
          onClick={renewSubscription}
          disabled={loading}
          style={{ backgroundColor: theme.primary, color: "#fff" }}
        >
          Pay / Renew Subscription
        </Button>

        {current?.status === "ACTIVE" && (
          <Button variant="destructive" onClick={cancelSubscription} disabled={loading}>
            Cancel Subscription
          </Button>
        )}
      </div>

     
    </div>
  );
}
