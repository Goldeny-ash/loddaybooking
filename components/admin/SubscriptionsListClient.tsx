"use client";

import Link from "next/link";

type BusinessRow = {
  _id: string;
  name?: string;
  access?: {
    status?: string;
    nextChargeAt?: string;
    lastChargeAt?: string;
  };
};

export default function SubscriptionsListClient({
  businesses,
}: {
  businesses: BusinessRow[];
}) {
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
            <th>Price</th>
            <th>Next Billing</th>
            <th>Last Charge</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {businesses.map((b) => (
            <tr key={b._id} className="border-b">
              <td>{b.name}</td>
              <td>{b.access?.status}</td>
              <td>KES 600 Monthly</td>
              <td>
                {b.access?.nextChargeAt
                  ? new Date(
                      b.access.nextChargeAt
                    ).toLocaleDateString()
                  : "-"}
              </td>
              <td className="text-xs">{b.access?.lastChargeAt ? new Date(b.access.lastChargeAt).toLocaleDateString() : "-"}</td>
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
