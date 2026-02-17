"use client";

import { useState, useEffect } from "react";

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
  const [maxRedemptions, setMaxRedemptions] = useState<number | undefined>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    fetch("/api/services")
      .then(res => res.json())
      .then(data => setServices(data.services || []));

    fetch("/api/promotions")
      .then(res => res.json())
      .then(data => setPromotions(data.promotions || []));
  }, []);

  /* ---------------- ACTIVE CHECK ---------------- */

  const isActive = (promo: Promotion) => {
    const now = new Date();
    const start = promo.startDate ? new Date(promo.startDate) : null;
    const end = promo.endDate ? new Date(promo.endDate) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  /* ---------------- HELPERS ---------------- */

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setTitle("");
    setType("percent");
    setValue(0);
    setPromoCode("");
    setStartDate("");
    setEndDate("");
    setMaxRedemptions(undefined);
    setSelectedServices([]);
  };

  const loadPromotion = (promo: Promotion) => {
    setEditingPromotion(promo);
    setTitle(promo.title);
    setType(promo.type);
    setValue(promo.value);
    setPromoCode(promo.promoCode || "");
    setStartDate(
      promo.startDate
        ? new Date(promo.startDate).toISOString().split("T")[0]
        : ""
    );
    setEndDate(
      promo.endDate
        ? new Date(promo.endDate).toISOString().split("T")[0]
        : ""
    );
    setMaxRedemptions(promo.maxRedemptions);
    setSelectedServices(promo.services || []);
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    const res = await fetch(`/api/promotions?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      setPromotions(prev => prev.filter(p => p._id !== id));
      resetForm();
    }
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = {
        title,
        type,
        value,
        promoCode,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxRedemptions,
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

      if (data.success) {
        if (editingPromotion) {
          setPromotions(prev =>
            prev.map(p =>
              p._id === data.promotion._id ? data.promotion : p
            )
          );
        } else {
          setPromotions(prev => [...prev, data.promotion]);
        }

        onSaved?.();
        resetForm();
      } else {
        setError(data.error || "Failed to save promotion");
      }
    } catch {
      setError("Network error");
    }

    setLoading(false);
  };

  /* ================= RENDER ================= */

  return (
    <div className="space-y-8">

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-xl shadow-lg border"
        style={{
          background: "var(--brand-bg-soft)",
          borderColor: "var(--brand-primary-light)",
        }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--brand-primary-dark)" }}
        >
          {editingPromotion ? "Edit Promotion" : "Create Promotion"}
        </h2>

        <input
          className="border p-2 w-full rounded mb-3"
          placeholder="Promotion Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <select
          className="border p-2 w-full rounded mb-3"
          value={type}
          onChange={e => setType(e.target.value as any)}
        >
          <option value="percent">Percentage Discount (%)</option>
          <option value="fixed">Fixed Amount Discount</option>
        </select>

        <input
          type="number"
          className="border p-2 w-full rounded mb-3"
          placeholder={type === "percent" ? "Percentage %" : "Amount"}
          value={value}
          onChange={e => setValue(Number(e.target.value))}
        />

        <input
          className="border p-2 w-full rounded mb-3"
          placeholder="Promo Code"
          value={promoCode}
          onChange={e => setPromoCode(e.target.value)}
        />

        <div className="flex gap-2 mb-3">
          <input
            type="date"
            className="border p-2 flex-1 rounded"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="border p-2 flex-1 rounded"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        <input
          type="number"
          className="border p-2 w-full rounded mb-4"
          placeholder="Max Redemptions"
          value={maxRedemptions || ""}
          onChange={e => setMaxRedemptions(Number(e.target.value))}
        />

        {/* SERVICES */}
        <div className="border p-3 rounded mb-4">
          <h4 className="font-semibold mb-2">Assign to Services</h4>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {services.map(s => (
              <button
                type="button"
                key={s._id}
                onClick={() => toggleService(s._id)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedServices.includes(s._id)
                    ? "text-white"
                    : "border"
                }`}
                style={
                  selectedServices.includes(s._id)
                    ? { background: "var(--brand-primary)" }
                    : {}
                }
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded text-white font-medium"
          style={{ background: "var(--brand-primary)" }}
        >
          {loading
            ? "Saving..."
            : editingPromotion
            ? "Update Promotion"
            : "Create Promotion"}
        </button>
      </form>

      {/* EXISTING PROMOTIONS */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Existing Promotions</h3>

        {promotions.map(p => {
          const active = isActive(p);

          return (
            <div
              key={p._id}
              className="p-5 rounded-xl shadow-lg transition hover:scale-[1.02]"
              style={{
                background: active
                  ? "linear-gradient(135deg, var(--brand-primary-light), var(--brand-primary))"
                  : "#f3f4f6",
                color: active ? "white" : "black",
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold">{p.title}</h4>
                  <p className="text-sm opacity-80">
                    {p.type === "percent"
                      ? `${p.value}% off`
                      : `Ksh ${p.value} off`}
                  </p>
                </div>

                <span
                  className="px-3 py-1 text-xs rounded-full font-medium"
                  style={{
                    background: active
                      ? "var(--brand-accent)"
                      : "#e5e7eb",
                    color: active ? "white" : "#333",
                  }}
                >
                  {active ? "ACTIVE" : "EXPIRED"}
                </span>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => loadPromotion(p)}
                  className="px-4 py-1 rounded bg-black text-sm font-medium"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(p._id)}
                  className="px-4 py-1 rounded bg-red-600 text-white text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}