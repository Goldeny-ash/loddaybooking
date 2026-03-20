"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemedPopup from "@/components/ThemedPopup";

type Affiliate = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  idDocumentUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAUSED";
  referralCode?: string | null;
  accessCode?: string | null;
  performanceReviewDueAt?: string;
  referralCount: number;
  latestReferralAt?: string;
  createdAt: string;
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
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupVariant, setPopupVariant] = useState<"success" | "error">("success");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const showPopup = (message: string, variant: "success" | "error" = "error") => {
    setPopupVariant(variant);
    setPopupMessage(message);
  };

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

  const runAction = async (affiliateId: string, action: "approve" | "reject" | "pause" | "resume") => {
    setLoadingId(`${action}-${affiliateId}`);

    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, action }),
      });
      const json = await res.json();

      if (!res.ok) {
        showPopup(json?.error || "Action failed");
        return;
      }

      showPopup(json?.message || "Affiliate updated.", "success");
      await load();
    } finally {
      setLoadingId(null);
    }
  };

  const approveWithdrawal = async (id: string) => {
    const res = await fetch(`/api/admin/affiliates/withdrawals/${id}/approve`, {
      method: "POST",
    });
    const json = await res.json();

    if (!res.ok) {
      showPopup(json?.error || "Failed to approve withdrawal");
      return;
    }

    showPopup("Withdrawal approved and disbursed.", "success");
    await load();
  };

  return (
    <div className="space-y-8">
      <ThemedPopup
        message={popupMessage}
        variant={popupVariant}
        onClose={() => setPopupMessage(null)}
      />

      <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Affiliate Applications</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">ID</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Codes</th>
                <th className="pb-3">Referrals</th>
                <th className="pb-3">Review Due</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr key={affiliate._id} className="border-b align-top">
                  <td className="py-3">
                    <Link
                      href={`/admin/affiliates/${affiliate._id}`}
                      className="font-medium text-[#15616D] underline-offset-4 hover:underline"
                    >
                      {affiliate.name}
                    </Link>
                  </td>
                  <td className="py-3">{affiliate.email}</td>
                  <td className="py-3">{affiliate.phone}</td>
                  <td className="py-3">
                    <a
                      href={affiliate.idDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#15616D] underline"
                    >
                      View ID
                    </a>
                  </td>
                  <td className="py-3">{affiliate.status}</td>
                  <td className="py-3">
                    <div>{affiliate.referralCode || "—"}</div>
                    <div>{affiliate.accessCode || "—"}</div>
                  </td>
                  <td className="py-3">
                    <div>{affiliate.referralCount}</div>
                    <div className="text-xs text-slate-500">
                      {affiliate.latestReferralAt
                        ? new Date(affiliate.latestReferralAt).toLocaleDateString()
                        : "No activity"}
                    </div>
                  </td>
                  <td className="py-3">
                    {affiliate.performanceReviewDueAt
                      ? new Date(affiliate.performanceReviewDueAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {affiliate.status === "PENDING" ? (
                        <>
                          <button
                            onClick={() => runAction(affiliate._id, "approve")}
                            disabled={loadingId === `approve-${affiliate._id}`}
                            className="rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => runAction(affiliate._id, "reject")}
                            disabled={loadingId === `reject-${affiliate._id}`}
                            className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}

                      {affiliate.status === "APPROVED" ? (
                        <button
                          onClick={() => runAction(affiliate._id, "pause")}
                          disabled={loadingId === `pause-${affiliate._id}`}
                          className="rounded-full bg-[#111827] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Pause
                        </button>
                      ) : null}

                      {affiliate.status === "PAUSED" ? (
                        <button
                          onClick={() => runAction(affiliate._id, "resume")}
                          disabled={loadingId === `resume-${affiliate._id}`}
                          className="rounded-full bg-[#15616D] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Resume
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Withdrawal Requests</h2>
        <div className="mt-4 space-y-3">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal._id}
              className="flex flex-col gap-3 rounded-2xl border border-black/5 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="text-sm">
                <p>
                  <strong>{withdrawal.affiliateId?.name || "Affiliate"}</strong> • {withdrawal.affiliateId?.email}
                </p>
                <p>KES {Number(withdrawal.amount).toLocaleString()} to {withdrawal.phoneNumber}</p>
                <p>Status: {withdrawal.status}</p>
              </div>

              {withdrawal.status === "REQUESTED" ? (
                <button
                  onClick={() => approveWithdrawal(withdrawal._id)}
                  className="rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Approve & Disburse
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
