"use client";

import { useState } from "react";

type Payload = {
  affiliate: {
    name: string;
    email: string;
    referralCode: string;
    availableBalance: number;
    totalEarned: number;
  };
  commissions: Array<{ _id: string; amount: number; type: string; status: string; createdAt: string }>;
  withdrawals: Array<{ _id: string; amount: number; status: string; createdAt: string }>;
};

export default function AffiliatePortalPage() {
  const [accessCode, setAccessCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");

  const maskedCode = accessCode.replace(/./g, "•");

  async function login() {
    if (!inputCode) return;

    setLoading(true);

    const code = inputCode.trim().toUpperCase();

    try {
      const res = await fetch(`/api/affiliates/me?code=${code}`);
      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Invalid affiliate code");
        return;
      }

      setAccessCode(code);
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  async function requestWithdrawal() {
    const res = await fetch("/api/affiliates/withdrawals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessCode,
        amount: Number(amount),
        phoneNumber: phone,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Request failed");
      return;
    }

    setAmount("");

    const refresh = await fetch(`/api/affiliates/me?code=${accessCode}`);
    const updated = await refresh.json();
    setData(updated);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* LOGIN POPUP */}
        {!data && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl">
              <h2 className="text-xl font-semibold text-center">
                Affiliate Login
              </h2>

              <input
                type="password"
                placeholder="Enter your access code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />

              <button
                onClick={login}
                disabled={loading}
                className="w-full bg-black text-white rounded py-2"
              >
                {loading ? "Loading..." : "Access Dashboard"}
              </button>
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {data && (
          <>
            <div className="rounded-xl bg-white border p-5">
              <h1 className="text-2xl font-bold">
                {data.affiliate.name} Affiliate Dashboard
              </h1>

              <p className="text-sm text-gray-600">
                Access Code: {maskedCode}
              </p>

              <p className="text-sm text-gray-600">
                Referral Code: {data.affiliate.referralCode}
              </p>

              <p className="text-sm">
                Available: KES {Number(data.affiliate.availableBalance || 0).toLocaleString()}
              </p>

              <p className="text-sm">
                Total Earned: KES {Number(data.affiliate.totalEarned || 0).toLocaleString()}
              </p>
            </div>

            {/* Withdrawal */}
            <div className="rounded-xl bg-white border p-5 space-y-3">
              <h2 className="text-lg font-semibold">Request Withdrawal</h2>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  placeholder="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border rounded px-3 py-2"
                />

                <input
                  placeholder="Phone (07.. or 254..)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border rounded px-3 py-2"
                />
              </div>

              <button
                onClick={requestWithdrawal}
                className="px-4 py-2 bg-black text-white rounded"
              >
                Request Payout
              </button>
            </div>

            {/* Commissions */}
            <div className="rounded-xl bg-white border p-5">
              <h2 className="text-lg font-semibold mb-2">Commissions</h2>

              <div className="space-y-2">
                {data.commissions.map((c) => (
                  <div key={c._id} className="border rounded p-2 text-sm">
                    KES {Number(c.amount).toLocaleString()} • {c.type} • {c.status} •{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>

            {/* Withdrawals */}
            <div className="rounded-xl bg-white border p-5">
              <h2 className="text-lg font-semibold mb-2">Withdrawals</h2>

              <div className="space-y-2">
                {data.withdrawals.map((w) => (
                  <div key={w._id} className="border rounded p-2 text-sm">
                    KES {Number(w.amount).toLocaleString()} • {w.status} •{" "}
                    {new Date(w.createdAt).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}