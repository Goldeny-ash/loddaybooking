"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RenewSubscriptionModal({
  onClose,
}: any) {
  const [loading, setLoading] = useState(false);

  const initiateSubscription = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/subscription/start", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }

      window.location.href = data.setup_url;
    } catch (err) {
      alert("Failed to start subscription");
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

        <p className="text-xs text-gray-400">
          Payments secured by IntaSend (M-Pesa / Card)
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
