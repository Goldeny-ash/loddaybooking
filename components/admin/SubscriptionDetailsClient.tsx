"use client";

import { useEffect, useState } from "react";

export default function SubscriptionDetailsClient({ business }: any) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch(
      `/api/admin/subscriptions/${business.access.subscriptionId}/transactions`
    )
      .then((res) => res.json())
      .then(setTransactions);
  }, []);

  const cancelSubscription = async () => {
    await fetch(
      `/api/admin/subscriptions/${business.access.subscriptionId}/cancel`,
      { method: "POST" }
    );
    alert("Subscription canceled");
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Subscription Details
      </h1>

      <div className="space-y-2">
        <p>Status: {business.access.status}</p>
        <p>Plan: {business.access.planId}</p>
        <p>Subscription ID: {business.access.subscriptionId}</p>
        <p>
          Next Billing:{" "}
          {business.access.nextChargeAt
            ? new Date(
                business.access.nextChargeAt
              ).toLocaleDateString()
            : "-"}
        </p>
      </div>

      <button
        onClick={cancelSubscription}
        className="text-red-600"
      >
        Cancel Subscription
      </button>

      <div>
        <h2 className="font-semibold mt-6">
          Transactions
        </h2>

        <table className="w-full border mt-2">
          <thead>
            <tr className="border-b">
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="border-b">
                <td>
                  {new Date(tx.created_at).toLocaleDateString()}
                </td>
                <td>{tx.amount}</td>
                <td>{tx.status}</td>
                <td className="text-xs">
                  {tx.reference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
}
