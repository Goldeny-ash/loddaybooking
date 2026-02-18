"use client";

import Link from "next/link";

export default function SubscriptionsListClient({ businesses }: any) {
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Active Subscriptions
      </h1>

      <table className="w-full border">
        <thead>
          <tr className="border-b text-left">
            <th>Business</th>
            <th>Status</th>
            <th>Plan</th>
            <th>Next Billing</th>
            <th>Subscription ID</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {businesses.map((b: any) => (
            <tr key={b._id} className="border-b">
              <td>{b.name}</td>
              <td>{b.access?.status}</td>
              <td>{b.access?.planId}</td>
              <td>
                {b.access?.nextChargeAt
                  ? new Date(
                      b.access.nextChargeAt
                    ).toLocaleDateString()
                  : "-"}
              </td>
              <td className="text-xs">
                {b.access?.subscriptionId}
              </td>
              <td>
                <Link
                  href={`/admin/subscriptions/${b._id}`}
                  className="text-blue-600"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
