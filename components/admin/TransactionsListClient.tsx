"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TransactionsListClient({
  transactions,
  businesses,
}: any) {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (businessId) params.append("businessId", businessId);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    router.push(
      `/admin/subscriptions/transactions?${params.toString()}`
    );
  };

  // Totals
  const totalGross = transactions.reduce(
    (sum: number, tx: any) => sum + tx.grossAmount,
    0
  );

  const totalFees = transactions.reduce(
    (sum: number, tx: any) => sum + tx.providerFee,
    0
  );

  const totalNet = transactions.reduce(
    (sum: number, tx: any) => sum + tx.netAmount,
    0
  );

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Subscription Transactions
      </h1>

      {/* Filters */}
      <div className="flex gap-4 items-end">

        <select
          className="border p-2"
          onChange={(e) => setBusinessId(e.target.value)}
        >
          <option value="">All Businesses</option>
          {businesses.map((b: any) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="border p-2"
          onChange={(e) => setFrom(e.target.value)}
        />

        <input
          type="date"
          className="border p-2"
          onChange={(e) => setTo(e.target.value)}
        />

        <button
          onClick={applyFilters}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Apply
        </button>

        <button
          onClick={() => window.print()}
          className="border px-4 py-2 rounded"
        >
          Export
        </button>

      </div>

      {/* Totals */}
      <div className="flex gap-8 font-semibold">
        <div>Total Gross: {totalGross}</div>
        <div>Total Fees: {totalFees}</div>
        <div>Total Net: {totalNet}</div>
      </div>

      {/* Table */}
      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th>Date</th>
            <th>Business</th>
            <th>Gross</th>
            <th>Fees</th>
            <th>Net</th>
            <th>Status</th>
            <th>Currency</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((tx: any) => (
            <tr key={tx._id} className="border-b">
              <td>
                {new Date(tx.chargedAt).toLocaleDateString()}
              </td>
              <td>{tx.businessId}</td>
              <td>{tx.grossAmount}</td>
              <td>{tx.providerFee}</td>
              <td>{tx.netAmount}</td>
              <td>{tx.status}</td>
              <td>{tx.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
