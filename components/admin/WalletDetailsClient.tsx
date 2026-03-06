"use client";

import { useState } from "react";
import axios from "axios";

interface WalletTransaction {
  _id: string;
  type: string;
  direction: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface WalletDetails {
  _id: string;
  walletId: string;
  currentBalance: number;
  availableBalance: number;
  isClearing?: boolean;
  canDisburse?: boolean;
  intasendLastSync?: string | null;
  businessId?: {
    name?: string;
  };
}

interface WalletDetailsProps {
  wallet: WalletDetails;
  transactions: WalletTransaction[];
}

export default function WalletDetailsClient({
  wallet,
  transactions,
}: WalletDetailsProps) {
  const [filter, setFilter] = useState("ALL");
  const [syncing, setSyncing] = useState(false);

  // Local balance state (so UI updates without reload)
  const [balances, setBalances] = useState({
    current: wallet.currentBalance,
    available: wallet.availableBalance,
  });
  const [syncMeta, setSyncMeta] = useState({
    isClearing: Boolean(wallet.isClearing),
    canDisburse: Boolean(wallet.canDisburse),
    intasendLastSync: wallet.intasendLastSync || null,
  });

  const filtered =
    filter === "ALL"
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const syncWallet = async () => {
    try {
      setSyncing(true);

      const resp = await axios.post(
        `/api/admin/wallets/${wallet._id}/sync`
      );

        if (resp.data.success) {
          setBalances({
            current: resp.data.currentBalance,
            available: resp.data.availableBalance,
          });
          setSyncMeta({
            isClearing: Boolean(resp.data.isClearing),
            canDisburse: Boolean(resp.data.canDisburse),
            intasendLastSync: resp.data.intasendLastSync || new Date().toISOString(),
          });

          alert("Wallet synced successfully");
        } else {
          alert(resp.data.error || "Sync failed");
        }
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error
        : undefined;
      alert(errorMessage || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Type", "Direction", "Amount", "Status"],
      ...filtered.map((t) => [
        new Date(t.createdAt).toLocaleString(),
        t.type,
        t.direction,
        t.amount,
        t.status,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `wallet_${wallet.walletId}.csv`;
    link.click();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">
        Wallet {wallet.walletId}
      </h1>

      <div className="mb-6 space-y-1">
        <p>
          <strong>Business:</strong>{" "}
          {wallet.businessId?.name || "Platform"}
        </p>
        <p>
          <strong>Current Balance:</strong> KES {balances.current}
        </p>
        <p>
          <strong>Available Balance:</strong> KES {balances.available}
        </p>
        <p>
          <strong>Status:</strong> {syncMeta.isClearing ? "Clearing" : "Available"}
        </p>
        <p>
          <strong>Can Disburse:</strong> {syncMeta.canDisburse ? "Yes" : "No"}
        </p>
        <p>
          <strong>Last Sync:</strong>{" "}
          {syncMeta.intasendLastSync
            ? new Date(syncMeta.intasendLastSync).toLocaleString()
            : "Never"}
        </p>
      </div>

      {/* 🔄 Sync Button */}
      <div className="mb-4">
        <button
          onClick={syncWallet}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {syncing ? "Syncing..." : "🔄 Sync from IntaSend"}
        </button>
      </div>

      {/* Filters + Export */}
      <div className="flex gap-4 mb-4">
        <select
          className="border p-2 rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="DEPOSIT">Deposits</option>
          <option value="REFUND">Refunds</option>
          <option value="WITHDRAWAL_MPESA">Withdrawals</option>
          <option value="WITHDRAWAL_BANK">Bank Withdrawals</option>
          <option value="INTERNAL_TRANSFER">Internal Transfers</option>
          <option value="ADJUSTMENT">Adjustments</option>
        </select>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Export CSV
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          filtered.map((t) => (
            <div
              key={t._id}
              className="border rounded p-4 bg-white shadow"
            >
              <p>
                <strong>{t.type}</strong> ({t.direction})
              </p>
              <p>Amount: KES {t.amount}</p>
              <p>Status: {t.status}</p>
              <p>
                Date: {new Date(t.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
