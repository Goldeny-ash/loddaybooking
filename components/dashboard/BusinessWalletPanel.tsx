"use client";

import { useEffect, useMemo, useState } from "react";
import { getTheme } from "@/lib/theme";
import ThemedPopup from "@/components/ThemedPopup";

type WalletInfo = {
  currentBalance?: number;
  availableBalance?: number;
  isClearing?: boolean;
  intasendLastSync?: string | Date | null;
};

type WalletStats = {
  withdrawable?: number;
  onHold?: number;
  availableBalance?: number;
  protectedFutureDeposits?: number;
  maxWithdrawable?: number;
};

type WalletTx = {
  _id: string;
  type?: string;
  createdAt?: string;
  amount?: number;
  status?: string;
};

type BusinessLike = {
  phone?: string;
  [key: string]: unknown;
};

interface Props {
  business: BusinessLike;
  wallet?: WalletInfo | null;
  transactions?: WalletTx[];
  stats?: WalletStats;
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 10;

function normalizePhone(phone: string) {
  if (!phone) return "";
  let cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("07")) cleaned = `254${cleaned.substring(1)}`;
  if (cleaned.startsWith("+254")) cleaned = cleaned.substring(1);
  return cleaned;
}

export default function BusinessWalletPanel({
  business,
  wallet: initialWallet,
  transactions: initialTransactions = [],
  stats: initialStats,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [syncingTx, setSyncingTx] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null | undefined>(initialWallet);
  const [transactions, setTransactions] = useState<WalletTx[]>(initialTransactions);
  const [stats, setStats] = useState<WalletStats | undefined>(initialStats);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPhone, setWithdrawPhone] = useState(
    normalizePhone(String(business?.phone || ""))
  );
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupVariant, setPopupVariant] = useState<"success" | "error">("success");
  const theme = getTheme(business || {});

  const loadSummary = async () => {
    const res = await fetch("/api/wallets/summary", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Failed to load wallet summary");
    }
    setWallet(data.wallet || null);
    setTransactions(data.transactions || []);
    setStats(data.stats || undefined);
  };

  useEffect(() => {
    if (initialWallet || initialStats) return;
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/wallets/summary", { cache: "no-store" });
        const data = await res.json();
        if (!mounted || !res.ok) return;
        setWallet(data.wallet || null);
        setTransactions(data.transactions || []);
        setStats(data.stats || undefined);
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [initialWallet, initialStats]);

  const legacyWithdrawable = useMemo(
    () => Number(stats?.withdrawable ?? 0),
    [stats]
  );
  const onHold = useMemo(() => Number(stats?.onHold ?? 0), [stats]);
  const availableBalance = useMemo(
    () => Number(stats?.availableBalance ?? wallet?.availableBalance ?? 0),
    [stats, wallet]
  );
  const protectedFutureDeposits = useMemo(
    () => Number(stats?.protectedFutureDeposits ?? 0),
    [stats]
  );
  const maxWithdrawable = useMemo(
    () => Number(stats?.maxWithdrawable ?? 0),
    [stats]
  );

  const showPopup = (message: string, variant: "success" | "error" = "success") => {
    setPopupVariant(variant);
    setPopupMessage(message);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollWithdrawalStatus = async (trackingId: string, payoutId: string) => {
    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
      const res = await fetch("/api/wallets/withdraw/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId, payoutId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showPopup(data?.error || "Could not check payout status", "error");
        return;
      }

      if (data.terminal) {
        if (data.status === "SUCCESS") {
          showPopup("Withdrawal successful.");
        } else if (data.status === "REVERSED") {
          showPopup("Withdrawal failed and funds were returned.", "error");
        } else {
          showPopup(`Withdrawal ${String(data.status).toLowerCase()}.`, "error");
        }
        await fetch("/api/wallets/transactions/sync", { method: "POST" }).catch(() => null);
        await loadSummary().catch(() => null);
        return;
      }

      if (attempt < MAX_POLL_ATTEMPTS) {
        await sleep(POLL_INTERVAL_MS);
      }
    }

    showPopup("Withdrawal is still processing. Keep this page open to refresh status.");
    await loadSummary().catch(() => null);
  };

  const syncTransactions = async () => {
    try {
      setSyncingTx(true);
      const res = await fetch("/api/wallets/transactions/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showPopup(data?.error || "Transaction sync failed", "error");
        return;
      }
      await loadSummary();
      showPopup(
        `Transactions synced. Added ${data.inserted || 0}, updated ${data.updated || 0}.`
      );
    } catch {
      showPopup("Transaction sync failed", "error");
    } finally {
      setSyncingTx(false);
    }
  };

  const submitWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showPopup("Enter a valid amount", "error");
      return;
    }
    if (amount > maxWithdrawable) {
      showPopup(
        `Amount exceeds max withdrawable (KES ${maxWithdrawable.toLocaleString()})`,
        "error"
      );
      return;
    }
    if (!withdrawPhone) {
      showPopup("Enter a valid M-Pesa number", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/wallets/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, phone: withdrawPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showPopup(data?.error || "Withdrawal failed", "error");
        return;
      }

      setShowWithdrawModal(false);
      setWithdrawAmount("");
      showPopup("Withdrawal initiated. Checking status...");
      await pollWithdrawalStatus(String(data.trackingId), String(data.payoutId));
    } catch {
      showPopup("Withdrawal error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-3xl border p-6 shadow-sm space-y-6"
      style={{
        borderColor: "var(--brand-primary-light)",
        background: `linear-gradient(180deg, #ffffff 0%, ${theme.backgroundSoft} 100%)`,
      }}
    >
      <h2 className="text-xl font-bold" style={{ color: "var(--brand-primary-dark)" }}>
        Business Wallet
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WalletCard
          label="Current Balance"
          value={Number(wallet?.currentBalance ?? 0)}
          color="var(--brand-primary-dark)"
        />
        <WalletCard label="Available Balance" value={availableBalance} color={theme.primary} />
        <WalletCard label="Max Withdrawable" value={maxWithdrawable} color={theme.accentDark} />
      </div>

      <div className="text-sm space-y-1" style={{ color: "var(--brand-accent-dark)" }}>
        <p>Status: {wallet?.isClearing ? "Clearing" : "Available for disbursement"}</p>
        <p>
          Protected future-booking deposits: KES{" "}
          {protectedFutureDeposits.toLocaleString()}
        </p>
        <p>
          Legacy completed-booking withdrawable: KES {legacyWithdrawable.toLocaleString()}
        </p>
        <p>On Hold: KES {onHold.toLocaleString()}</p>
        <p>
          Last Sync:{" "}
          {wallet?.intasendLastSync
            ? new Date(wallet.intasendLastSync).toLocaleString()
            : "Never"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          disabled={loading || maxWithdrawable <= 0}
          onClick={() => setShowWithdrawModal(true)}
          className="w-full py-3 rounded-xl font-semibold transition disabled:opacity-60 text-white"
          style={{ background: maxWithdrawable > 0 ? theme.primary : "#9ca3af" }}
        >
          {loading
            ? "Processing..."
            : maxWithdrawable > 0
              ? `Withdraw (up to KES ${maxWithdrawable.toLocaleString()})`
              : "No Withdrawable Balance"}
        </button>

        <button
          disabled={syncingTx}
          onClick={syncTransactions}
          className="w-full py-3 rounded-xl font-semibold transition disabled:opacity-60 text-white"
          style={{ background: "var(--brand-primary-dark)" }}
        >
          {syncingTx ? "Syncing..." : "Sync IntaSend Transactions"}
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
          Recent Transactions
        </h3>

        {transactions.length === 0 && (
          <p className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
            No transactions available.
          </p>
        )}

        {transactions.map((t) => (
          <div
            key={t._id}
            className="border rounded-xl p-3 flex justify-between"
            style={{ borderColor: "var(--brand-primary-light)" }}
          >
            <div>
              <p className="font-medium">{t.type}</p>
              <p className="text-sm text-gray-500">
                {t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}
              </p>
            </div>
            <div className="text-right">
              <p>KES {Number(t.amount ?? 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500">{t.status}</p>
            </div>
          </div>
        ))}
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border shadow-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold">Withdraw to M-Pesa</h3>
            <p className="text-sm text-gray-600">
              Available: KES {availableBalance.toLocaleString()} | Max withdrawable: KES{" "}
              {maxWithdrawable.toLocaleString()}
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">M-Pesa Number</label>
              <input
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(normalizePhone(e.target.value))}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="2547XXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (KES)</label>
              <input
                type="number"
                min={1}
                max={Math.floor(maxWithdrawable)}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder={`Max ${maxWithdrawable.toLocaleString()}`}
              />
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg border px-3 py-2"
                onClick={() => setShowWithdrawModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg px-3 py-2 text-white disabled:opacity-60"
                style={{ background: theme.primary }}
                onClick={submitWithdraw}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemedPopup
        message={popupMessage}
        onClose={() => setPopupMessage(null)}
        variant={popupVariant}
      />
    </div>
  );
}

function WalletCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-primary-light)" }}>
      <p className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
        {label}
      </p>
      <p className="text-xl font-semibold" style={{ color }}>
        KES {Number(value).toLocaleString()}
      </p>
    </div>
  );
}
