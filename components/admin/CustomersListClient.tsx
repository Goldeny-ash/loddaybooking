"use client";

import { useState } from "react";

export default function CustomersListClient({
  businesses: initialBusinesses,
}: any) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/subscriptions/customers");
    const data = await res.json();
    setBusinesses(data);
  };

  const createCustomer = async (businessId: string) => {
    setLoadingId(businessId);

    await fetch(
      `/api/admin/subscriptions/customers/${businessId}`,
      { method: "POST" }
    );

    setLoadingId(null);
    refresh();
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Subscription Customers
      </h1>

      <table className="w-full border">
        <thead>
          <tr className="border-b text-left">
            <th>Business</th>
            <th>Email</th>
            <th>Status</th>
            <th>IntaSend Customer ID</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {businesses.map((b: any) => (
            <tr key={b._id} className="border-b">
              <td>{b.name}</td>
              <td>{b.email}</td>
              <td>{b.access?.status}</td>
              <td className="text-xs">
                {b.access?.billing?.customerId || "-"}
              </td>
              <td>
                {!b.access?.billing?.customerId && (
                  <button
                    onClick={() => createCustomer(b._id)}
                    disabled={loadingId === b._id}
                    className="text-blue-600"
                  >
                    {loadingId === b._id
                      ? "Creating..."
                      : "Create Customer"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
