"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface WalletWithBusiness {
  _id: string;
  walletId: string;
  label: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  canDisburse: boolean;
  isClearing?: boolean;
  intasendLastSync?: string | Date | null;
  businessId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function WalletsListClient({
  wallets,
}: {
  wallets: WalletWithBusiness[];
}) {
  const router = useRouter();
  const [syncingAll, setSyncingAll] = useState(false);

  const syncAllWallets = async () => {
    try {
      setSyncingAll(true);
      const resp = await axios.post("/api/admin/wallets/sync");
      const data = resp.data || {};
      alert(
        `Sync complete. Updated ${data.syncedCount ?? 0} / ${data.total ?? wallets.length} wallet(s).${data.failedCount ? ` Failed: ${data.failedCount}` : ""}`
      );
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error
        : undefined;
      alert(errorMessage || "Bulk sync failed");
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Platform Wallets</h1>
        <button
          onClick={syncAllWallets}
          disabled={syncingAll}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {syncingAll ? "Syncing wallets..." : "Sync All from IntaSend"}
        </button>
      </div>

      {wallets.length === 0 ? (
        <p>No wallets found.</p>
      ) : (
        <div className="space-y-4">
          {wallets.map((wallet) => (
            <div
              key={wallet._id}
              onClick={() => router.push(`/admin/wallets/${wallet._id}`)}
              className="border rounded p-4 bg-white shadow cursor-pointer hover:bg-gray-50"
            >
              <p><strong>Wallet ID:</strong> {wallet.walletId}</p>
              <p><strong>Label:</strong> {wallet.label}</p>
              <p><strong>Business:</strong> {wallet.businessId?.name || "Platform"}</p>
              <p><strong>Currency:</strong> {wallet.currency}</p>
              <p><strong>Current Balance:</strong> KES {wallet.currentBalance}</p>
              <p><strong>Available Balance:</strong> KES {wallet.availableBalance}</p>
              <p><strong>Status:</strong> {wallet.isClearing ? "Clearing" : "Available"}</p>
              <p><strong>Can Disburse:</strong> {wallet.canDisburse ? "Yes" : "No"}</p>
              <p>
                <strong>Last Sync:</strong>{" "}
                {wallet.intasendLastSync
                  ? new Date(wallet.intasendLastSync).toLocaleString()
                  : "Never"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
