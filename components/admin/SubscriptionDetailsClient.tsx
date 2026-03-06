"use client";

type BusinessAccess = {
  status?: string;
  lastChargeAt?: string;
  nextChargeAt?: string;
  subscriptionExpiresAt?: string;
};

type BusinessDetails = {
  access?: BusinessAccess;
};

export default function SubscriptionDetailsClient({
  business,
}: {
  business: BusinessDetails;
}) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Subscription Details</h1>

      <div className="space-y-2 text-sm">
        <p>Status: {business?.access?.status || "-"}</p>
        <p>
          Last Charge:{" "}
          {business?.access?.lastChargeAt
            ? new Date(business.access.lastChargeAt).toLocaleDateString()
            : "-"}
        </p>
        <p>
          Next Billing:{" "}
          {business?.access?.nextChargeAt
            ? new Date(business.access.nextChargeAt).toLocaleDateString()
            : "-"}
        </p>
        <p>
          Expires:{" "}
          {business?.access?.subscriptionExpiresAt
            ? new Date(business.access.subscriptionExpiresAt).toLocaleDateString()
            : "-"}
        </p>
      </div>

      <p className="text-sm text-gray-600">
        This installation uses website-managed STK subscriptions (fixed KES 600 monthly).
      </p>
    </div>
  );
}
