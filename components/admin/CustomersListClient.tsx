"use client";

import { useMemo, useState } from "react";

type BusinessRow = {
  _id: string;
  name?: string;
  email?: string;
  username?: string;
  marketplaceVisible?: boolean;
  marketplaceStatus?: string;
  access?: {
    status?: string;
    nextChargeAt?: string;
    subscriptionExpiresAt?: string;
    billing?: {
      customerId?: string;
    };
  };
  adminBenefits?: {
    demoBusiness?: boolean;
    freeMonthGrantedAt?: string;
    freeMonthEndsAt?: string;
  };
};

function formatDate(value?: string) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "-";
  }
}

export default function CustomersListClient({
  businesses: initialBusinesses,
}: {
  businesses: BusinessRow[];
}) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<Record<string, "demo" | "freeMonth" | undefined>>({});

  const filteredBusinesses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return businesses;

    return businesses.filter((business) => {
      const haystack = [
        business.name,
        business.email,
        business.username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [businesses, query]);

  async function updateBusinessBenefit(
    businessId: string,
    action: "demo" | "freeMonth",
    value: boolean
  ) {
    setSaving((current) => ({ ...current, [businessId]: action }));

    try {
      const response = await fetch(`/api/admin/business-benefits/${businessId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, value }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update business benefit.");
      }

      setBusinesses((current) =>
        current.map((business) =>
          business._id === businessId ? { ...business, ...data.business } : business
        )
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to update business benefit.");
    } finally {
      setSaving((current) => ({ ...current, [businessId]: undefined }));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Platform admin
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Business access controls</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Select a business and manage special platform-only benefits like permanent demo visibility
          and a one-time free month subscription.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by business name, username, or email"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-semibold">Business</th>
                <th className="px-5 py-4 font-semibold">Subscription</th>
                <th className="px-5 py-4 font-semibold">Next billing</th>
                <th className="px-5 py-4 font-semibold">Demo business</th>
                <th className="px-5 py-4 font-semibold">Free month</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business) => {
                const isSavingDemo = saving[business._id] === "demo";
                const isSavingFreeMonth = saving[business._id] === "freeMonth";
                const freeMonthGranted = Boolean(business.adminBenefits?.freeMonthGrantedAt);

                return (
                  <tr key={business._id} className="border-t border-slate-100 align-top">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{business.name || "Untitled business"}</p>
                        <p className="text-slate-500">{business.email || "No email"}</p>
                        <p className="text-xs text-slate-400">@{business.username || "no-username"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-800">{business.access?.status || "INACTIVE"}</p>
                        <p className="text-xs text-slate-400">
                          Marketplace:{" "}
                          {business.adminBenefits?.demoBusiness
                            ? "Demo override"
                            : `${business.marketplaceStatus || "none"}${business.marketplaceVisible ? " / visible" : ""}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-slate-600">
                        <p>{formatDate(business.access?.nextChargeAt)}</p>
                        {freeMonthGranted ? (
                          <p className="text-xs text-emerald-600">
                            Free month ends {formatDate(business.adminBenefits?.freeMonthEndsAt)}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Expires {formatDate(business.access?.subscriptionExpiresAt)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(business.adminBenefits?.demoBusiness)}
                          disabled={isSavingDemo}
                          onChange={(event) =>
                            void updateBusinessBenefit(business._id, "demo", event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span>{isSavingDemo ? "Saving..." : "Demo business"}</span>
                      </label>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={freeMonthGranted}
                            disabled={freeMonthGranted || isSavingFreeMonth}
                            onChange={(event) => {
                              if (event.target.checked) {
                                void updateBusinessBenefit(business._id, "freeMonth", true);
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span>
                            {isSavingFreeMonth
                              ? "Granting..."
                              : freeMonthGranted
                                ? "Free month granted"
                                : "Give a free month"}
                          </span>
                        </label>
                        <p className="max-w-xs text-xs leading-5 text-slate-400">
                          Grants one immediate active month, sends a congratulations email, and sets
                          the next billing date 30 days ahead.
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredBusinesses.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                    No businesses matched your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
