"use client";

import { useState } from "react";
import Link from "next/link";
import ThemedPopup from "@/components/ThemedPopup";

type ReferredBusiness = {
  id: string;
  name: string;
  ownerName?: string;
  referredAt?: string;
  bookingLink?: string;
  status: string;
};

type Props = {
  affiliate: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
    referralCode?: string | null;
    totalEarned: number;
    availableBalance: number;
    paidOutTotal: number;
  };
  referredBusinesses: ReferredBusiness[];
  pendingEarnings: number;
};

export default function AffiliateDetailClient({
  affiliate,
  referredBusinesses,
  pendingEarnings,
}: Props) {
  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  const copyCode = async () => {
    if (!affiliate.referralCode) return;
    await navigator.clipboard.writeText(affiliate.referralCode);
    setPopupMessage("Referral code copied.");
  };

  return (
    <div className="space-y-6">
      <ThemedPopup message={popupMessage} variant="success" onClose={() => setPopupMessage(null)} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#78290F]/60">
            Affiliate Detail
          </p>
          <h1 className="mt-2 font-serif text-4xl text-[#111827]">{affiliate.name}</h1>
        </div>
        <Link href="/admin/affiliates" className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-slate-700">
          Back to affiliates
        </Link>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827]">Affiliate Overview</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p><strong className="text-[#111827]">Full Name:</strong> {affiliate.name}</p>
            <p><strong className="text-[#111827]">Email:</strong> {affiliate.email}</p>
            <p><strong className="text-[#111827]">Phone:</strong> {affiliate.phone}</p>
            <p><strong className="text-[#111827]">Status:</strong> {affiliate.status}</p>
            <p><strong className="text-[#111827]">Date Joined:</strong> {new Date(affiliate.createdAt).toLocaleDateString()}</p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827]">Referral Code</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-[#f7f4ef] px-4 py-3 text-lg font-semibold text-[#111827]">
              {affiliate.referralCode || "Not generated"}
            </div>
            <button
              type="button"
              onClick={copyCode}
              disabled={!affiliate.referralCode}
              className="rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy Code
            </button>
          </div>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        <article className="rounded-[1.8rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Businesses Referred</p>
          <p className="mt-2 text-3xl font-semibold text-[#111827]">{referredBusinesses.length}</p>
        </article>
        <article className="rounded-[1.8rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Earnings</p>
          <p className="mt-2 text-3xl font-semibold text-[#111827]">KES {affiliate.totalEarned.toLocaleString()}</p>
        </article>
        <article className="rounded-[1.8rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending Earnings</p>
          <p className="mt-2 text-3xl font-semibold text-[#111827]">KES {pendingEarnings.toLocaleString()}</p>
        </article>
        <article className="rounded-[1.8rem] border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Withdrawn</p>
          <p className="mt-2 text-3xl font-semibold text-[#111827]">KES {affiliate.paidOutTotal.toLocaleString()}</p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#111827]">Referral Performance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3">Business Name</th>
                <th className="pb-3">Owner Name</th>
                <th className="pb-3">Date Referred</th>
                <th className="pb-3">Booking Link / ID</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {referredBusinesses.map((business) => (
                <tr key={business.id} className="border-b">
                  <td className="py-3">{business.name}</td>
                  <td className="py-3">{business.ownerName || "—"}</td>
                  <td className="py-3">{business.referredAt ? new Date(business.referredAt).toLocaleDateString() : "—"}</td>
                  <td className="py-3">
                    {business.bookingLink ? (
                      <a href={business.bookingLink} target="_blank" rel="noreferrer" className="text-[#15616D] underline">
                        Open booking page
                      </a>
                    ) : (
                      business.id
                    )}
                  </td>
                  <td className="py-3">{business.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
