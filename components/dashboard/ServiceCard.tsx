"use client";
import { useState, useEffect } from "react";
import { Pencil, Trash2, Copy, Truck, EyeOff } from "lucide-react";
import AddServiceForm from "@/components/dashboard/AddServiceForm";

interface ServiceCardProps {
  service: any;
  onRemove: (id: string) => void;
  onUpdate?: (updatedService: any) => void;
  className?: string;
}

export default function ServiceCard({ service, onRemove, onUpdate, className = "" }: ServiceCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);

  // Fetch promotion details if only IDs are present
  useEffect(() => {
    if (!service.promotions?.length) return;

    const fetchPromotions = async () => {
      try {
        const res = await fetch("/api/promotions"); // API should return all promotions or by IDs
        const data = await res.json();
        const mapped = service.promotions.map((p: any) =>
          typeof p === "string" ? data.promotions.find((promo: any) => promo._id === p) : p
        );
        setPromotions(mapped.filter(Boolean));
      } catch (err) {
        console.error(err);
      }
    };

    fetchPromotions();
  }, [service.promotions]);

  const handleEditSave = (updatedService: any) => {
    if (onUpdate) onUpdate(updatedService);
    setEditOpen(false);
  };

  const renderPromotionBadge = (promo: any, idx: number) => {
    let label = "";
    switch (promo.type) {
      case "percent":
        label = `🔥 ${promo.value}% Off`;
        break;
      case "fixed":
        label = `🔥 KES ${promo.value} Off`;
        break;
      case "first_time":
        label = "🎉 First Time";
        break;
      case "off_peak":
        label = "⏰ Off-Peak";
        break;
      default:
        label = promo.title;
        break;
    }

    return (
      <span
        key={idx}
        className="px-2 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: "var(--brand-accent-light)",
          color: "var(--brand-accent-dark)",
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <>
      <div
        className={`rounded-xl shadow p-4 relative border ${className}`}
        style={{ borderColor: "var(--brand-primary)", backgroundColor: "var(--brand-bg-soft)" }}
      >
        <h3 className="font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
          {service.name}
        </h3>
        <p className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
          {service.durationMinutes} min • {service.price ? `KES ${service.price}` : "No Price"}
        </p>

        <div className="flex gap-2 mt-2 flex-wrap">
          {service.depositOverride?.enabled && (
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: "var(--brand-accent-light)", color: "var(--brand-accent-dark)" }}
            >
              Deposit
            </span>
          )}
          {service.isBundle && (
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
            >
              Bundle
            </span>
          )}
          {service.mobileEligible && (
            <span
              className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
              style={{ backgroundColor: "var(--brand-accent-light)", color: "var(--brand-accent-dark)" }}
            >
              <Truck size={12} /> Mobile
            </span>
          )}
          {promotions?.map((p, idx) => renderPromotionBadge(p, idx))}
          {service.addOns?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {service.addOns.map((a: { title: string; price: number }, i: number) => (
              <span key={i} className="px-2 py-1 rounded text-xs bg-gray-100">
                {a.title} +KES {a.price}
              </span>
              ))}
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={() => setEditOpen(true)} style={{ color: "var(--brand-primary-dark)" }} title="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={() => onRemove(service._id)} style={{ color: "red" }} title="Delete">
            <Trash2 size={16} />
          </button>
          <button style={{ color: "var(--brand-accent-dark)" }} title="Duplicate">
            <Copy size={16} />
          </button>
          <button style={{ color: "var(--brand-accent-dark)" }} title="Hide">
            <EyeOff size={16} />
          </button>
        </div>
      </div>

      {editOpen && (
        <AddServiceForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onAdd={handleEditSave}
          initialData={service}
        />
      )}
    </>
  );
}
