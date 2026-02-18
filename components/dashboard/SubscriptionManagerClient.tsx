"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function SubscriptionManagerClient({
  business,
  subscription,
  transactions,
}: any) {
  const [loading, setLoading] = useState(false);

  const cancelSubscription = async () => {
    if (!confirm("Cancel your subscription?")) return;

    try {
      setLoading(true);

      await axios.post("/api/subscription/cancel");

      alert("Subscription cancelled.");
      window.location.reload();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* PLAN INFO */}
      <div className="rounded-xl border p-6 space-y-3">
        <h2 className="text-xl font-semibold">Current Plan</h2>

        <p>
          <strong>Status:</strong> {subscription?.status || "Inactive"}
        </p>

        <p>
          <strong>Plan:</strong> KES 600 Monthly
        </p>

        <p>
          <strong>Next Billing:</strong>{" "}
          {subscription?.nextChargeAt
            ? new Date(subscription.nextChargeAt).toDateString()
            : "—"}
        </p>

        <p>
          <strong>Payment Method:</strong>{" "}
          {subscription?.paymentMethod || "M-Pesa"}
        </p>

        {subscription?.status === "ACTIVE" && (
          <Button
            variant="destructive"
            onClick={cancelSubscription}
            disabled={loading}
          >
            Cancel Subscription
          </Button>
        )}
      </div>

      {/* LAST 3 TRANSACTIONS */}
      <div className="rounded-xl border p-6">
        <h2 className="text-xl font-semibold mb-4">
          Recent Payments
        </h2>

        {transactions.length === 0 && (
          <p className="text-sm text-gray-500">
            No transactions yet.
          </p>
        )}

        {transactions.map((tx: any) => (
          <div
            key={tx._id}
            className="flex justify-between py-2 border-b last:border-none"
          >
            <div>
              <p className="font-medium">
                {tx.currency} {tx.grossAmount}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(tx.chargedAt).toDateString()}
              </p>
            </div>

            <div className="text-right text-sm">
              <p>Status: {tx.status}</p>
              <p>Fee: {tx.providerFee}</p>
              <p>Net: {tx.netAmount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
