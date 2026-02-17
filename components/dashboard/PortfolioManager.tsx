"use client";

import { useState, useEffect } from "react";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Service {
  _id: string;
  name: string;
}

interface ReferenceImage {
  _id: string;
  images: {
    url: string;
    description: string;
    dateDone?: string;
    staffId?: string;
    tags: string[];
  }[];
  linkedServiceIds: string[];
}

interface PortfolioManagerProps {
  businessId: string;
  services: Service[];
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    brandBgSoft?: string;
  };
}

export default function PortfolioManager({ businessId, services, theme }: PortfolioManagerProps) {
  const [portfolio, setPortfolio] = useState<ReferenceImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // URLs for upload
  const [metadataMap, setMetadataMap] = useState<{ [url: string]: { description: string; dateDone?: string; staffId?: string; tags: string[] } }>({});

  // Fetch portfolio on mount
  useEffect(() => {
    fetch(`/api/portfolio?businessId=${businessId}`)
      .then(res => res.json())
      .then(data => setPortfolio(data.images || []))
      .catch(err => console.error(err));
  }, [businessId]);

  // Handle metadata input change
  const handleMetadataChange = (url: string, field: keyof typeof metadataMap[string], value: any) => {
    setMetadataMap(prev => ({
      ...prev,
      [url]: { ...prev[url], [field]: value },
    }));
  };

  // Upload new portfolio entry
  const handleUploadPortfolio = async () => {
    if (!selectedImages.length) return;

    const imagesPayload = selectedImages.map(url => ({
      url,
      description: metadataMap[url]?.description || "",
      dateDone: metadataMap[url]?.dateDone || undefined,
      staffId: metadataMap[url]?.staffId || undefined,
      tags: metadataMap[url]?.tags || [],
    }));

    const res = await fetch("/api/portfolio/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, images: imagesPayload }),
    });

    const data = await res.json();
    if (data.ok) {
      setPortfolio(prev => [...prev, data.refImage]);
      setSelectedImages([]);
      setMetadataMap({});
    }
  };

  // Delete a portfolio entry
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this portfolio entry?")) return;
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      setPortfolio(prev => prev.filter(p => p._id !== id));
    }
  };

  // Link/unlink a reference to a service
  const toggleServiceLink = async (refId: string, serviceId: string) => {
    const ref = portfolio.find(p => p._id === refId);
    if (!ref) return;

    const isLinked = ref.linkedServiceIds.includes(serviceId);
    const updatedServices = isLinked
      ? ref.linkedServiceIds.filter(id => id !== serviceId)
      : [...ref.linkedServiceIds, serviceId];

    // Call API
    await fetch("/api/portfolio/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refImageId: refId, serviceIds: updatedServices }),
    });

    setPortfolio(prev =>
      prev.map(p =>
        p._id === refId ? { ...p, linkedServiceIds: updatedServices } : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div
        className="p-4 rounded-xl shadow"
        style={{ backgroundColor: theme?.brandBgSoft || "#fff" }}
      >
        <h2 className="font-semibold text-[var(--brand-primary)] mb-3">Upload Portfolio Images</h2>
        <ImageUpload value={selectedImages} onChange={setSelectedImages} />
        {selectedImages.map(url => (
          <div key={url} className="p-2 mt-2 border rounded flex flex-col gap-2">
            <img src={url} className="w-32 h-32 object-cover rounded" />
            <input
              type="text"
              placeholder="Description"
              value={metadataMap[url]?.description || ""}
              onChange={e => handleMetadataChange(url, "description", e.target.value)}
              className="border p-1 rounded"
            />
            <input
              type="date"
              value={metadataMap[url]?.dateDone || ""}
              onChange={e => handleMetadataChange(url, "dateDone", e.target.value)}
              className="border p-1 rounded"
            />
            <input
              type="text"
              placeholder="Staff ID"
              value={metadataMap[url]?.staffId || ""}
              onChange={e => handleMetadataChange(url, "staffId", e.target.value)}
              className="border p-1 rounded"
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={(metadataMap[url]?.tags || []).join(",")}
              onChange={e => handleMetadataChange(url, "tags", e.target.value.split(",").map(t => t.trim()))}
              className="border p-1 rounded"
            />
          </div>
        ))}
        {selectedImages.length > 0 && (
          <Button className="mt-2" onClick={handleUploadPortfolio}>
            Save Portfolio Images
          </Button>
        )}
      </div>

      {/* Portfolio List */}
      <div className="space-y-4">
        <h2 className="font-semibold text-[var(--brand-primary)]">Your Portfolio</h2>
        {portfolio.map(ref => (
          <div
            key={ref._id}
            className="p-4 rounded-xl shadow flex flex-col gap-2"
            style={{ backgroundColor: theme?.brandBgSoft || "#fff" }}
          >
            <div className="flex gap-2 flex-wrap">
              {ref.images.map((img, idx) => (
                <div key={idx} className="relative w-32 h-32">
                  <img src={img.url} className="object-cover w-32 h-32 rounded" />
                  <button
                    onClick={() => handleDelete(ref._id)}
                    className="absolute top-1 right-1 bg-white p-1 rounded-full shadow hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {services.map(service => (
                <button
                  key={service._id}
                  onClick={() => toggleServiceLink(ref._id, service._id)}
                  className={`px-3 py-1 rounded text-white ${
                    ref.linkedServiceIds.includes(service._id)
                      ? "bg-[var(--brand-primary)]"
                      : "bg-gray-400"
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
