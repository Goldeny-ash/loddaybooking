"use client";
import { useState, useEffect } from "react";
import { Pencil, Trash2, Copy, Truck, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import AddServiceForm from "@/components/dashboard/AddServiceForm";

interface ServiceCardProps {
  service: any;
  onRemove: (id: string) => Promise<void> | void;
  onUpdate?: (updatedService: any) => void;
  className?: string;
}

export default function ServiceCard({
  service,
  onRemove,
  onUpdate,
  className = "",
}: ServiceCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!service.promotions?.length) return;

    const fetchPromotions = async () => {
      try {
        const res = await fetch("/api/promotions");
        const data = await res.json();
        const mapped = service.promotions.map((p: any) =>
          typeof p === "string"
            ? data.promotions.find((promo: any) => promo._id === p)
            : p
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
    toast.success("Service updated");
    setEditOpen(false);
  };

  const handleDelete = () => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Delete this service permanently?</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-red-600 text-white text-xs"
            onClick={async () => {
              toast.dismiss(t.id);
              setDeleting(true);
              try {
                await onRemove(service._id);
                toast.success("Service deleted");
              } catch {
                toast.error("Failed to delete service");
              } finally {
                setDeleting(false);
              }
            }}
          >
            Confirm
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-200 text-xs"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  const displayPrice =
    service.basePrice ??
    service.price ??
    service.priceRange?.min ??
    service.priceRangeMin ??
    service.priceTiers?.[0]?.price ??
    null;

  const renderPromotionBadge = (promo: any, idx: number) => {
    let label = "";
    switch (promo.type) {
      case "percent":
        label = `${promo.value}% Off`;
        break;
      case "fixed":
        label = `KES ${promo.value} Off`;
        break;
      case "first_time":
        label = "First Time";
        break;
      case "off_peak":
        label = "Off-Peak";
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
        className={`group rounded-xl shadow p-4 relative border ${className}`}
        style={{
          borderColor: "var(--brand-primary)",
          backgroundColor: "var(--brand-bg-soft)",
        }}
      >
        <h3 className="font-semibold" style={{ color: "var(--brand-primary-dark)" }}>
          {service.name}
        </h3>
        <p className="text-sm" style={{ color: "var(--brand-accent-dark)" }}>
          {service.durationMinutes ?? 0} min •{" "}
          {displayPrice !== null ? `KES ${displayPrice}` : "No Price"}
        </p>

        <div className="flex gap-2 mt-2 flex-wrap">
          {service.depositOverride?.enabled && (
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: "var(--brand-accent-light)",
                color: "var(--brand-accent-dark)",
              }}
            >
              Deposit
            </span>
          )}
          {service.isBundle && (
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: "var(--brand-primary-light)",
                color: "var(--brand-primary-dark)",
              }}
            >
              Bundle
            </span>
          )}
          {service.mobileEligible && (
            <span
              className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
              style={{
                backgroundColor: "var(--brand-accent-light)",
                color: "var(--brand-accent-dark)",
              }}
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

        <div className="absolute top-2 right-2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-md p-1 bg-white/90 border"
            style={{ color: "var(--brand-primary-dark)" }}
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md p-1 bg-white/90 border disabled:opacity-50"
            style={{ color: "red" }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
          <button
            className="rounded-md p-1 bg-white/90 border"
            style={{ color: "var(--brand-accent-dark)" }}
            title="Duplicate"
          >
            <Copy size={16} />
          </button>
          <button
            className="rounded-md p-1 bg-white/90 border"
            style={{ color: "var(--brand-accent-dark)" }}
            title="Hide"
          >
            <EyeOff size={16} />
          </button>
        </div>
      </div>

      {editOpen && (
        <AddServiceForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onAdd={handleEditSave}
          onDelete={async (serviceId) => {
            await onRemove(serviceId);
            setEditOpen(false);
          }}
          initialData={service}
        />
      )}
    </>
  );
}
