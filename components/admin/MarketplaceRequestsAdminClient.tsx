"use client";

import { useEffect, useState } from "react";

import ThemedPopup from "@/components/ThemedPopup";

type RequestItem = {
  _id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  description: string;
  location?: {
    county?: string;
    subCounty?: string;
    ward?: string;
    area?: string;
  };
  marketplaceVisible: boolean;
  marketplaceStatus: "pending" | "approved" | "rejected" | "none";
  marketplaceRequestedAt?: string;
  marketplaceRejectionReason?: string;
  services: Array<{ name?: string; category?: string }>;
  images: string[];
};

export default function MarketplaceRequestsAdminClient() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [popup, setPopup] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch("/api/admin/marketplace");
    const payload = await response.json();
    setRequests(payload.requests || []);
  };

  useEffect(() => {
    load();
  }, []);

  const runAction = async (businessId: string, action: "approve" | "reject") => {
    const rejectionReason =
      action === "reject"
        ? window.prompt("Enter rejection reason", "Please improve your business details and reapply.") || ""
        : "";

    if (action === "reject" && !rejectionReason.trim()) {
      return;
    }

    setLoadingId(`${action}-${businessId}`);

    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, action, rejectionReason }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setPopup({ message: payload.error || "Unable to update request.", variant: "error" });
        return;
      }

      setPopup({ message: payload.message || "Request updated.", variant: "success" });
      await load();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ThemedPopup
        message={popup?.message || null}
        variant={popup?.variant || "success"}
        onClose={() => setPopup(null)}
      />

      {requests.map((request) => (
        <section key={request._id} className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-[#111827]">{request.name}</h2>
                <span className="rounded-full bg-[#f7f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  {request.marketplaceStatus}
                </span>
                {request.marketplaceVisible ? (
                  <span className="rounded-full bg-[#e7f8ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#15616D]">
                    Visible
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-600">
                @{request.username} • {request.email} • {request.phone}
              </p>
              <p className="text-sm text-slate-600">
                {[request.location?.area, request.location?.ward, request.location?.subCounty, request.location?.county]
                  .filter(Boolean)
                  .join(", ") || "No location provided"}
              </p>
              <p className="text-sm text-slate-500">
                Requested{" "}
                {request.marketplaceRequestedAt
                  ? new Date(request.marketplaceRequestedAt).toLocaleString()
                  : "Not available"}
              </p>
              {request.marketplaceStatus === "rejected" && request.marketplaceRejectionReason ? (
                <p className="text-sm text-red-600">Reason: {request.marketplaceRejectionReason}</p>
              ) : null}
              {request.description ? <p className="text-sm leading-6 text-slate-600">{request.description}</p> : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => runAction(request._id, "approve")}
                disabled={loadingId === `approve-${request._id}`}
                className="rounded-full bg-[#15616D] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => runAction(request._id, "reject")}
                disabled={loadingId === `reject-${request._id}`}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Services</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {request.services.length ? (
                  request.services.map((service, index) => (
                    <span
                      key={`${service.name || "service"}-${index}`}
                      className="rounded-full bg-[#f7f4ef] px-3 py-2 text-xs text-slate-700"
                    >
                      {service.name || "Service"}
                      {service.category ? ` • ${service.category}` : ""}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No services yet.</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Images</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {request.images.length ? (
                  request.images.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`${request.name} preview ${index + 1}`}
                      className="h-28 w-full rounded-2xl object-cover"
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No images available.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
