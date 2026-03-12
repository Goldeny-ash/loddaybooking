"use client";

import { useEffect, useMemo, useState } from "react";
import ThemedPopup from "@/components/ThemedPopup";

interface Service {
  _id: string;
  name: string;
}

interface Promotion {
  _id: string;
  title: string;
  type: "percent" | "fixed";
  value: number;
  promoCode?: string;
  startDate?: string;
  endDate?: string;
  maxRedemptions?: number;
  services: string[];
}

interface PromotionFormProps {
  onSaved?: () => void;
}

type PopupState = {
  message: string;
  variant: "success" | "error";
  mode?: "toast" | "confirm";
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
} | null;

export default function PromotionForm({ onSaved }: PromotionFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number>(0);
  const [promoCode, setPromoCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<PopupState>(null);

  const closePopup = () => setPopup(null);

  const showError = (message: string) => {
    setPopup({
      message,
      variant: "error",
      mode: "toast",
    });
  };

  const showSuccess = (message: string) => {
    setPopup({
      message,
      variant: "success",
      mode: "toast",
    });
  };

  const fetchServicesAndPromotions = async () => {
    try {
      const [servicesRes, promotionsRes] = await Promise.all([
        fetch("/api/services/public"),
        fetch("/api/promotions"),
      ]);

      const servicesData = await servicesRes.json();
      const promotionsData = await promotionsRes.json();

      setServices(Array.isArray(servicesData.services) ? servicesData.services : []);
      setPromotions(Array.isArray(promotionsData.promotions) ? promotionsData.promotions : []);
    } catch {
      showError("Failed to load services and promotions.");
    }
  };

  useEffect(() => {
    void fetchServicesAndPromotions();
  }, []);

  const isActive = (promo: Promotion) => {
    const now = new Date();
    const start = promo.startDate ? new Date(promo.startDate) : null;
    const end = promo.endDate ? new Date(promo.endDate) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setTitle("");
    setType("percent");
    setValue(0);
    setPromoCode("");
    setStartDate("");
    setEndDate("");
    setMaxRedemptions(0);
    setSelectedServices([]);
  };

  const loadPromotion = (promo: Promotion) => {
    setEditingPromotion(promo);
    setTitle(promo.title || "");
    setType(promo.type || "percent");
    setValue(Number(promo.value || 0));
    setPromoCode(promo.promoCode || "");
    setStartDate(promo.startDate ? new Date(promo.startDate).toISOString().split("T")[0] : "");
    setEndDate(promo.endDate ? new Date(promo.endDate).toISOString().split("T")[0] : "");
    setMaxRedemptions(Number(promo.maxRedemptions || 0));
    setSelectedServices(Array.isArray(promo.services) ? promo.services : []);
  };

  const validateForm = () => {
    if (!title.trim()) return "Promotion title is required.";
    if (!type) return "Promotion type is required.";
    if (!Number.isFinite(value) || value <= 0) return "Promotion value is required.";
    if (!promoCode.trim()) return "Promo code is required.";
    if (!startDate) return "Start date is required.";
    if (!endDate) return "End date is required.";
    if (new Date(endDate) < new Date(startDate)) return "End date must be after start date.";
    if (!Number.isFinite(maxRedemptions) || maxRedemptions <= 0) {
      return "Max redemptions is required.";
    }
    if (selectedServices.length === 0) return "At least one service is required.";
    return null;
  };

  const handleDelete = async (id: string) => {
    setPopup({
      title: "Delete Promotion",
      message: "Are you sure you want to delete this promotion?",
      variant: "error",
      mode: "confirm",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        closePopup();
        try {
          const res = await fetch(`/api/promotions?id=${id}`, { method: "DELETE" });
          const data = await res.json();

          if (!res.ok || !data.success) {
            showError(data.error || "Failed to delete promotion.");
            return;
          }

          setPromotions((prev) => prev.filter((p) => p._id !== id));
          if (editingPromotion?._id === id) resetForm();
          showSuccess("Promotion deleted successfully.");
        } catch {
          showError("Network error while deleting promotion.");
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    setLoading(true);

    try {
      const body = {
        title: title.trim(),
        type,
        value: Number(value),
        promoCode: promoCode.trim().toUpperCase(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxRedemptions: Number(maxRedemptions),
        services: selectedServices,
        _id: editingPromotion?._id,
      };

      const method = editingPromotion ? "PUT" : "POST";
      const res = await fetch("/api/promotions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.error || "Failed to save promotion.");
        return;
      }

      if (editingPromotion) {
        setPromotions((prev) => prev.map((p) => (p._id === data.promotion._id ? data.promotion : p)));
        showSuccess("Promotion updated successfully.");
      } else {
        setPromotions((prev) => [...prev, data.promotion]);
        showSuccess("Promotion created successfully.");
      }

      onSaved?.();
      resetForm();
    } catch {
      showError("Network error while saving promotion.");
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceCountText = useMemo(() => {
    if (selectedServices.length === 0) return "No services selected";
    if (selectedServices.length === 1) return "1 service selected";
    return `${selectedServices.length} services selected`;
  }, [selectedServices.length]);

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border p-6 shadow-lg"
        style={{
          background: "var(--brand-bg-soft)",
          borderColor: "var(--brand-primary-light)",
        }}
      >
        <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--brand-primary-dark)" }}>
          {editingPromotion ? "Edit Promotion" : "Create Promotion"}
        </h2>

        <label className="mb-1 block text-sm font-medium">Promotion Title *</label>
        <input
          className="mb-3 w-full rounded border p-2"
          placeholder="Promotion title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="mb-1 block text-sm font-medium">Promotion Type *</label>
        <select
          className="mb-3 w-full rounded border p-2"
          value={type}
          onChange={(e) => setType(e.target.value as "percent" | "fixed")}
        >
          <option value="percent">Percentage Discount (%)</option>
          <option value="fixed">Fixed Amount Discount</option>
        </select>

        <label className="mb-1 block text-sm font-medium">Discount Value *</label>
        <input
          type="number"
          className="mb-3 w-full rounded border p-2"
          placeholder={type === "percent" ? "Percentage (e.g. 10)" : "Amount (e.g. 500)"}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />

        <label className="mb-1 block text-sm font-medium">Promo Code *</label>
        <input
          className="mb-3 w-full rounded border p-2"
          placeholder="PROMO2026"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
        />

        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Start Date *</label>
            <input
              type="date"
              className="w-full rounded border p-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">End Date *</label>
            <input
              type="date"
              className="w-full rounded border p-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium">Max Redemptions *</label>
        <input
          type="number"
          className="mb-4 w-full rounded border p-2"
          placeholder="100"
          value={maxRedemptions || ""}
          onChange={(e) => setMaxRedemptions(Number(e.target.value))}
        />

        <div className="mb-4 rounded border p-3">
          <h4 className="mb-1 font-semibold">Assign to Services *</h4>
          <p className="mb-2 text-xs text-gray-500">{selectedServiceCountText}</p>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {services.map((service) => (
              <button
                type="button"
                key={service._id}
                onClick={() => toggleService(service._id)}
                className={`rounded px-3 py-1 text-sm ${selectedServices.includes(service._id) ? "text-white" : "border"}`}
                style={selectedServices.includes(service._id) ? { background: "var(--brand-primary)" } : {}}
              >
                {service.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded py-2 font-medium text-white"
          style={{ background: "var(--brand-primary)" }}
        >
          {loading ? "Saving..." : editingPromotion ? "Update Promotion" : "Create Promotion"}
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Existing Promotions</h3>
        {promotions.map((promo) => {
          const active = isActive(promo);

          return (
            <div
              key={promo._id}
              className="rounded-xl p-5 shadow-lg transition hover:scale-[1.02]"
              style={{
                background: active
                  ? "linear-gradient(135deg, var(--brand-primary-light), var(--brand-primary))"
                  : "#f3f4f6",
                color: active ? "white" : "black",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{promo.title}</h4>
                  <p className="text-sm opacity-80">
                    {promo.type === "percent" ? `${promo.value}% off` : `Ksh ${promo.value} off`}
                  </p>
                </div>

                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: active ? "var(--brand-accent)" : "#e5e7eb",
                    color: active ? "white" : "#333",
                  }}
                >
                  {active ? "ACTIVE" : "EXPIRED"}
                </span>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => loadPromotion(promo)}
                  className="rounded bg-black px-4 py-1 text-sm font-medium text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => void handleDelete(promo._id)}
                  className="rounded bg-red-600 px-4 py-1 text-sm text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ThemedPopup
        message={popup?.message || null}
        variant={popup?.variant || "success"}
        mode={popup?.mode || "toast"}
        title={popup?.title}
        confirmText={popup?.confirmText}
        cancelText={popup?.cancelText}
        onConfirm={popup?.onConfirm}
        onClose={closePopup}
      />
    </div>
  );
}

