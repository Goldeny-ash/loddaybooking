"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import ThemedPopup from "@/components/ThemedPopup";

type Commission = {
  _id: string;
  amount: number;
  withdrawnAmount?: number;
  status: "PENDING" | "AVAILABLE" | "WITHDRAWN";
  description?: string;
  createdAt: string;
  earnedAt?: string;
  availableAt?: string;
};

type Withdrawal = {
  _id: string;
  amount: number;
  status: string;
  createdAt?: string;
  requestedAt?: string;
};

type AffiliatePayload = {
  affiliate: {
    name: string;
    email: string;
    phone: string;
    referralCode?: string | null;
    status: string;
  };
  commissions: Commission[];
  withdrawals: Withdrawal[];
  totalEarned: number;
  withdrawableAmount: number;
  pendingAmount: number;
  withdrawnAmount: number;
  referralCount: number;
};

function formatKES(value: number) {
  return `KES ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AffiliateDashboardClient() {
  const [accessCode, setAccessCode] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [data, setData] = useState<AffiliatePayload | null>(null);
  const [popup, setPopup] = useState<{ title: string; message: string } | null>(null);

  const canWithdraw = useMemo(() => (data?.withdrawableAmount || 0) > 0, [data]);

  async function loadDashboard(event?: FormEvent) {
    event?.preventDefault();

    if (!accessCode.trim()) {
      setPopup({ title: "Access code required", message: "Enter your affiliate access code." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/affiliates/me?code=${encodeURIComponent(accessCode.trim())}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load your affiliate dashboard.");
      }

      setData(payload);
    } catch (error) {
      setPopup({
        title: "Unable to continue",
        message: error instanceof Error ? error.message : "Unable to load your affiliate dashboard.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function requestWithdrawal() {
    const numericAmount = Number(amount || 0);

    if (!canWithdraw) {
      setPopup({
        title: "Nothing available yet",
        message:
          "Withdrawals are available 7 days after a commission is earned, in line with payout processing timelines.",
      });
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setPopup({ title: "Invalid amount", message: "Enter a valid withdrawal amount." });
      return;
    }

    setWithdrawing(true);

    try {
      const response = await fetch("/api/affiliates/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: accessCode.trim(),
          amount: numericAmount,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit withdrawal request.");
      }

      setPopup({
        title: "Withdrawal requested",
        message: payload.message || "Your withdrawal request has been submitted.",
      });
      setAmount("");
      await loadDashboard();
    } catch (error) {
      setPopup({
        title: "Withdrawal failed",
        message: error instanceof Error ? error.message : "Unable to submit withdrawal request.",
      });
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f4ee] px-4 py-8 text-black sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#15616D]">
            Lodday Affiliates
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Affiliate dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Withdrawals are available 7 days after a commission is earned, in line with payout
            processing timelines.
          </p>

          <form onSubmit={loadDashboard} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Enter your access code"
              className="h-12 flex-1 rounded-2xl border border-gray-200 bg-white px-4 text-black outline-none transition focus:border-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : "Open dashboard"}
            </button>
          </form>
        </section>

        {data ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                  Amount Available to Withdraw
                </p>
                <p className="mt-3 text-3xl font-semibold text-black">
                  {formatKES(data.withdrawableAmount)}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                  Pending Earnings
                </p>
                <p className="mt-3 text-3xl font-semibold text-black">
                  {formatKES(data.pendingAmount)}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                  Total Earned
                </p>
                <p className="mt-3 text-3xl font-semibold text-black">{formatKES(data.totalEarned)}</p>
              </div>
              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                  Referral Code
                </p>
                <p className="mt-3 text-xl font-semibold text-black">
                  {data.affiliate.referralCode || "Pending approval"}
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-black">{data.affiliate.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">{data.affiliate.email}</p>
                    <p className="text-sm text-gray-600">{data.affiliate.phone}</p>
                  </div>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700">
                    {data.affiliate.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#f8f4ee] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Referrals
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-black">{data.referralCount}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f8f4ee] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Withdrawn
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-black">
                      {formatKES(data.withdrawnAmount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8f4ee] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Withdrawal Requests
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-black">{data.withdrawals.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-black">Request withdrawal</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Only commissions past their 7-day holding window can be withdrawn.
                </p>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount in KES"
                  className="mt-5 h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-black outline-none transition focus:border-black"
                />
                <button
                  type="button"
                  onClick={requestWithdrawal}
                  disabled={withdrawing || !canWithdraw}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#15616D] px-6 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {withdrawing ? "Submitting..." : "Request withdrawal"}
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-black">Commissions</h2>
                <div className="mt-5 space-y-4">
                  {data.commissions.length ? (
                    data.commissions.map((commission) => (
                      <div
                        key={commission._id}
                        className="rounded-2xl border border-gray-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-black">
                              {commission.description || "Affiliate commission"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Earned {formatDate(commission.earnedAt || commission.createdAt)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Available {formatDate(commission.availableAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-black">
                              {formatKES(commission.amount)}
                            </p>
                            <span className="mt-1 inline-flex rounded-full bg-[#f8f4ee] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-700">
                              {commission.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No commissions yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-black">Withdrawals</h2>
                <div className="mt-5 space-y-4">
                  {data.withdrawals.length ? (
                    data.withdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal._id}
                        className="rounded-2xl border border-gray-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-black">
                              {formatKES(withdrawal.amount)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Requested {formatDate(withdrawal.requestedAt || withdrawal.createdAt)}
                            </p>
                          </div>
                          <span className="inline-flex rounded-full bg-[#f8f4ee] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-700">
                            {withdrawal.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No withdrawal requests yet.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>

      <ThemedPopup
        onClose={() => setPopup(null)}
        title={popup?.title || ""}
        message={popup?.message || null}
      />
    </div>
  );
}
