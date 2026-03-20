"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Pencil, Save, Trash2, X } from "lucide-react";
import ThemedPopup from "@/components/ThemedPopup";

interface Service {
  _id: string;
  name: string;
  basePrice?: number;
}

interface PortfolioImage {
  _id?: string;
  url: string;
  description: string;
  totalCost?: number;
  durationMinutes?: number;
  priceBreakdown?: string;
  likes?: number;
}

interface ReferenceImage {
  _id: string;
  images: PortfolioImage[];
  linkedServiceIds: string[];
}

interface PortfolioManagerProps {
  businessId: string;
  services: Service[];
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    primary?: string;
    accent?: string;
    brandBgSoft?: string;
  };
}

type UploadMeta = {
  description: string;
  totalCost?: string;
  durationMinutes?: string;
  priceBreakdown?: string;
};

type EditMeta = {
  description: string;
  totalCost?: string;
  durationMinutes?: string;
  priceBreakdown?: string;
};

const parseAmount = (value?: string | number) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value || "")
    .replace(/,/g, "")
    .trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function PortfolioManager({
  businessId,
  services,
  theme,
}: PortfolioManagerProps) {
  const [portfolio, setPortfolio] = useState<ReferenceImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [metadataMap, setMetadataMap] = useState<Record<string, UploadMeta>>({});
  const [savingUpload, setSavingUpload] = useState(false);
  const [savingLinkFor, setSavingLinkFor] = useState<string | null>(null);
  const [savingEditFor, setSavingEditFor] = useState<string | null>(null);
  const [deletingFor, setDeletingFor] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editMap, setEditMap] = useState<Record<string, EditMeta>>({});
  const [popup, setPopup] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const showSuccess = (message: string) => setPopup({ message, variant: "success" });
  const showError = (message: string) => setPopup({ message, variant: "error" });

  useEffect(() => {
    fetch(`/api/portfolio?businessId=${businessId}`)
      .then((res) => res.json())
      .then((data) => setPortfolio(data.images || []))
      .catch(() => showError("Failed to load portfolio."));
  }, [businessId]);

  const sortedPortfolio = useMemo(() => {
    return [...portfolio].reverse();
  }, [portfolio]);

  const handleMetadataChange = (
    url: string,
    field: keyof UploadMeta,
    value: string
  ) => {
    setMetadataMap((prev) => ({
      ...prev,
      [url]: { ...prev[url], [field]: value },
    }));
  };

  const handleUploadPortfolio = async () => {
    if (!selectedImages.length || savingUpload) return;
    setSavingUpload(true);

    const imagesPayload = selectedImages.map((url) => ({
      url,
      description: metadataMap[url]?.description || "",
      totalCost: parseAmount(metadataMap[url]?.totalCost),
      durationMinutes: parseAmount(metadataMap[url]?.durationMinutes),
      priceBreakdown: metadataMap[url]?.priceBreakdown || "",
    }));

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, images: imagesPayload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save portfolio");

      setPortfolio((prev) => [...prev, data.refImage]);
      setSelectedImages([]);
      setMetadataMap({});
      showSuccess("Portfolio images saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save portfolio";
      showError(message);
    } finally {
      setSavingUpload(false);
    }
  };

  const persistRefImages = async (refId: string, nextImages: PortfolioImage[]) => {
    const res = await fetch(`/api/portfolio/${refId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: nextImages.map((img) => ({
          url: img.url,
          description: img.description || "",
          totalCost: parseAmount(img.totalCost),
          durationMinutes: parseAmount(img.durationMinutes),
          priceBreakdown: img.priceBreakdown || "",
          likes: Number(img.likes || 0),
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update portfolio item");
    return data.refImage as ReferenceImage;
  };

  const handleDeleteImage = async (refId: string, imageIndex: number) => {
    const key = `${refId}-${imageIndex}`;
    setDeletingFor(key);
    try {
      const ref = portfolio.find((p) => p._id === refId);
      if (!ref) throw new Error("Portfolio entry not found");

      const remaining = ref.images.filter((_, idx) => idx !== imageIndex);

      if (!remaining.length) {
        const res = await fetch(`/api/portfolio/${refId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Delete failed");
        setPortfolio((prev) => prev.filter((p) => p._id !== refId));
      } else {
        const updated = await persistRefImages(refId, remaining);
        setPortfolio((prev) => prev.map((p) => (p._id === refId ? updated : p)));
      }

      showSuccess("Portfolio image deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete image";
      showError(message);
    } finally {
      setDeletingFor(null);
    }
  };

  const startEdit = (refId: string, imageIndex: number, image: PortfolioImage) => {
    const key = `${refId}-${imageIndex}`;
    setEditingKey(key);
    setEditMap((prev) => ({
      ...prev,
      [key]: {
        description: image.description || "",
        totalCost: String(Number(image.totalCost || 0)),
        durationMinutes: String(Number(image.durationMinutes || 0)),
        priceBreakdown: image.priceBreakdown || "",
      },
    }));
  };

  const saveEdit = async (refId: string, imageIndex: number) => {
    const key = `${refId}-${imageIndex}`;
    const draft = editMap[key];
    if (!draft) return;
    setSavingEditFor(key);

    try {
      const ref = portfolio.find((p) => p._id === refId);
      if (!ref) throw new Error("Portfolio entry not found");

      const nextImages = ref.images.map((img, idx) =>
        idx === imageIndex
          ? {
              ...img,
              description: draft.description,
              totalCost: parseAmount(draft.totalCost),
              durationMinutes: parseAmount(draft.durationMinutes),
              priceBreakdown: draft.priceBreakdown || "",
            }
          : img
      );

      const updated = await persistRefImages(refId, nextImages);
      setPortfolio((prev) => prev.map((p) => (p._id === refId ? updated : p)));
      setEditingKey(null);
      showSuccess("Portfolio image updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save edits";
      showError(message);
    } finally {
      setSavingEditFor(null);
    }
  };

  const toggleServiceLink = async (refId: string, serviceId: string) => {
    const ref = portfolio.find((p) => p._id === refId);
    if (!ref) return;

    const isLinked = ref.linkedServiceIds.includes(serviceId);
    const updatedServices = isLinked
      ? ref.linkedServiceIds.filter((id) => id !== serviceId)
      : [...ref.linkedServiceIds, serviceId];

    setSavingLinkFor(refId);
    try {
      const res = await fetch("/api/portfolio/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refImageId: refId, serviceIds: updatedServices }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update service links");

      setPortfolio((prev) =>
        prev.map((p) => (p._id === refId ? { ...p, linkedServiceIds: updatedServices } : p))
      );
      showSuccess(isLinked ? "Service removed from portfolio reference." : "Service linked to this reference photo.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update service links";
      showError(message);
    } finally {
      setSavingLinkFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="p-4 rounded-xl shadow"
        style={{ backgroundColor: theme?.brandBgSoft || "#fff" }}
      >
        <h2 className="font-semibold text-[var(--brand-primary)] mb-1">Upload Portfolio Images</h2>
        <p className="text-sm text-gray-600 mb-3">
          Add reference photos for services shown on your public booking page. For each image,
          include the final look description, duration, total price, and a clear price breakdown.
        </p>
        <ImageUpload value={selectedImages} onChange={setSelectedImages} />

        {selectedImages.map((url) => (
          <div key={url} className="p-3 mt-3 border rounded flex flex-col gap-2 bg-white">
            <img src={url} alt="Portfolio upload preview" className="w-32 h-32 object-cover rounded" />

            <label className="text-sm font-medium text-gray-700">Description (what work was done)</label>
            <input
              type="text"
              placeholder="e.g. Skin fade with textured top and beard line-up"
              value={metadataMap[url]?.description || ""}
              onChange={(e) => handleMetadataChange(url, "description", e.target.value)}
              className="border p-2 rounded"
            />

            <label className="text-sm font-medium text-gray-700">Duration in minutes</label>
            <input
              type="number"
              min={0}
              value={metadataMap[url]?.durationMinutes || ""}
              onChange={(e) => handleMetadataChange(url, "durationMinutes", e.target.value)}
              className="border p-2 rounded"
            />

            <label className="text-sm font-medium text-gray-700">Total service cost (KES)</label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 2500"
              value={metadataMap[url]?.totalCost || ""}
              onChange={(e) => handleMetadataChange(url, "totalCost", e.target.value)}
              className="border p-2 rounded"
            />

            <label className="text-sm font-medium text-gray-700">Price Breakdown</label>
            <textarea
              placeholder={`Hair: 1000 KES\nLabor: 1500 KES\nStyling: 500 KES`}
              value={metadataMap[url]?.priceBreakdown || ""}
              onChange={(e) => handleMetadataChange(url, "priceBreakdown", e.target.value)}
              className="min-h-[110px] border p-2 rounded"
            />
          </div>
        ))}

        {selectedImages.length > 0 && (
          <Button className="mt-3" onClick={handleUploadPortfolio} disabled={savingUpload}>
            {savingUpload ? "Saving..." : "Save Portfolio Images"}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-[var(--brand-primary)]">Your Portfolio</h2>
        <p className="text-sm text-gray-600">
          Link each portfolio reference to one or more services so customers can view relevant previous work.
          
        </p>

        {sortedPortfolio.map((ref) => (
          <div
            key={ref._id}
            className="p-4 rounded-xl shadow flex flex-col gap-3"
            style={{ backgroundColor: theme?.brandBgSoft || "#fff" }}
          >
            <div className="flex gap-3 flex-wrap">
              {ref.images.map((img, idx) => {
                const key = `${ref._id}-${idx}`;
                const isEditing = editingKey === key;
                const isSavingEdit = savingEditFor === key;
                return (
                  <div key={key} className="relative w-56 border rounded-lg p-2 bg-white">
                    <img src={img.url} alt="Portfolio item" className="object-cover w-full h-32 rounded" />

                    {!isEditing && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="font-medium">{img.description || "No description added."}</p>
                        <p className="text-gray-600">
                          Duration: {img.durationMinutes ? `${img.durationMinutes} mins` : "Not set"}
                        </p>
                        <p className="text-gray-700 font-semibold">
                          Total Cost: KES {Number(img.totalCost || 0).toLocaleString()}
                        </p>
                        {img.priceBreakdown ? (
                          <p className="whitespace-pre-line text-xs text-gray-600">
                            {img.priceBreakdown}
                          </p>
                        ) : null}
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-2 space-y-2">
                        <input
                          className="border rounded p-2 w-full text-sm"
                          value={editMap[key]?.description || ""}
                          onChange={(e) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], description: e.target.value },
                            }))
                          }
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          min={0}
                          className="border rounded p-2 w-full text-sm"
                          value={editMap[key]?.durationMinutes || ""}
                          onChange={(e) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], durationMinutes: e.target.value },
                            }))
                          }
                          placeholder="Duration in minutes"
                        />
                        <input
                          type="number"
                          min={0}
                          className="border rounded p-2 w-full text-sm"
                          value={editMap[key]?.totalCost || ""}
                          onChange={(e) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], totalCost: e.target.value },
                            }))
                          }
                          placeholder="Total cost"
                        />
                        <textarea
                          className="min-h-[110px] border rounded p-2 w-full text-sm"
                          value={editMap[key]?.priceBreakdown || ""}
                          onChange={(e) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], priceBreakdown: e.target.value },
                            }))
                          }
                          placeholder="Price breakdown"
                        />
                      </div>
                    )}

                    <div className="mt-2 flex gap-2">
                      {!isEditing ? (
                        <button
                          onClick={() => startEdit(ref._id, idx, img)}
                          className="p-2 rounded bg-gray-100 hover:bg-gray-200"
                          title="Edit image details"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => saveEdit(ref._id, idx)}
                            disabled={isSavingEdit}
                            className="p-2 rounded bg-[var(--brand-primary)] text-white disabled:opacity-60"
                            title="Save edits"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="p-2 rounded bg-gray-100 hover:bg-gray-200"
                            title="Cancel edit"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteImage(ref._id, idx)}
                        disabled={deletingFor === key}
                        className="p-2 rounded bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-60"
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <button
                  key={service._id}
                  onClick={() => toggleServiceLink(ref._id, service._id)}
                  disabled={savingLinkFor === ref._id}
                  className={`px-3 py-2 rounded text-white text-sm ${
                    ref.linkedServiceIds.includes(service._id)
                      ? "bg-[var(--brand-primary)]"
                      : "bg-gray-500"
                  } disabled:opacity-60`}
                >
                  {service.name} 
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ThemedPopup
        message={popup?.message || null}
        variant={popup?.variant || "success"}
        onClose={() => setPopup(null)}
      />
    </div>
  );
}
