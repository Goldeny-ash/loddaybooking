"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RenewSubscriptionModal({
  onClose,
}: any) {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const initiateSubscription = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/subscription/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "mpesa",
          phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.details?.[0]?.message || data.error || "Failed"
        );
      }

      if (data.setup_url) {
        window.location.href = data.setup_url;
        return;
      }

      alert(data.message || "STK push sent. Complete payment on your phone.");
      onClose?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start subscription");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 relative">

        {loading && (
          <div className="absolute inset-0 bg-white/80 grid place-items-center rounded-xl">
            <Loader2 className="animate-spin" />
          </div>
        )}

        <h2 className="text-xl font-semibold">
          Activate Subscription
        </h2>

        <div className="text-sm text-gray-500">
          KES 600 / month <br />
          Auto-renews monthly
        </div>

        <input
          type="tel"
          placeholder="M-Pesa phone e.g. 07XXXXXXXX"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <p className="text-xs text-gray-400">
          Payments secured by IntaSend (M-Pesa)
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={initiateSubscription}
            disabled={loading}
          >
            Subscribe Now
          </Button>
        </div>
      </div>
    </div>
  );
}
