"use client";

import { useEffect, useState } from "react";

type Affiliate = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  accessCode: string;
  referralCode: string;
  codeExpiresAt: string;
  availableBalance: number;
  totalEarned: number;
};

type Withdrawal = {
  _id: string;
  amount: number;
  phoneNumber: string;
  status: string;
  affiliateId?: { name?: string; email?: string };
  createdAt: string;
};

export default function AffiliatesAdminClient() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [aRes, wRes] = await Promise.all([
      fetch("/api/admin/affiliates"),
      fetch("/api/admin/affiliates/withdrawals"),
    ]);
    const aData = await aRes.json();
    const wData = await wRes.json();
    setAffiliates(aData.affiliates || []);
    setWithdrawals(wData.withdrawals || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createAffiliate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err?.error || "Failed");
        return;
      }
      setForm({ name: "", email: "", phone: "" });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (id: string) => {
    const res = await fetch(`/api/admin/affiliates/withdrawals/${id}/approve`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err?.error || "Failed to approve withdrawal");
      return;
    }
    await load();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border p-4 bg-white space-y-3">
        <h2 className="text-lg font-semibold">Create Affiliate</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={createAffiliate}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white"
        >
          {loading ? "Saving..." : "Create Affiliate"}
        </button>
      </section>

      <section className="rounded-xl border p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">Affiliates</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th>Name</th>
                <th>Email</th>
                <th>Access Code</th>
                <th>Referral Code</th>
                <th>Expires</th>
                <th>Balance</th>
                <th>Total Earned</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a._id} className="border-b">
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.accessCode}</td>
                  <td>{a.referralCode}</td>
                  <td>{new Date(a.codeExpiresAt).toLocaleDateString()}</td>
                  <td>KES {Number(a.availableBalance || 0).toLocaleString()}</td>
                  <td>KES {Number(a.totalEarned || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">Withdrawal Requests</h2>
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div key={w._id} className="border rounded p-3 flex items-center justify-between">
              <div className="text-sm">
                <p>
                  <strong>{w.affiliateId?.name || "Affiliate"}</strong> • {w.affiliateId?.email}
                </p>
                <p>KES {Number(w.amount).toLocaleString()} to {w.phoneNumber}</p>
                <p>Status: {w.status}</p>
              </div>
              {w.status === "REQUESTED" && (
                <button
                  onClick={() => approveWithdrawal(w._id)}
                  className="px-3 py-2 rounded bg-green-600 text-white text-sm"
                >
                  Approve & Disburse
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
