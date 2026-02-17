"use client";
import { useEffect, useState } from "react";
import ServiceCard from "./ServiceCard";
import AddServiceForm from "./AddServiceForm";

export default function ServicesManager({ business }: { business: any }) {
  const [services, setServices] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingService, setEditingService] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/services/public")
      .then(r => r.json())
      .then(d => setServices(d.services || []));
  }, []);

  const filtered = services.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

  const handleAddOrUpdate = (service: any) => {
    setServices(prev => {
      const index = prev.findIndex(s => s._id === service._id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = service;
        return updated;
      }
      return [...prev, service];
    });
    setEditingService(null);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setOpen(true);
  };

  return (
    <div className="rounded-xl shadow p-4" style={{ backgroundColor: "var(--brand-bg-soft)", border: "1px solid var(--brand-primary)" }}>
      <div className="flex justify-between mb-4">
        <h2 className="font-bold" style={{ color: "var(--brand-primary-dark)" }}>Services</h2>
        <button
          onClick={() => { setEditingService(null); setOpen(true); }}
          className="px-3 py-1 rounded font-medium"
          style={{ backgroundColor: "var(--brand-primary)", color: "white" }}
        >
          + Add Service
        </button>
      </div>

      <input
        placeholder="Search services..."
        className="border p-2 w-full mb-4 rounded"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ borderColor: "var(--brand-primary)" }}
      />

      {services.length === 0 && (
        <p className="text-center py-8" style={{ color: "var(--brand-accent-dark)" }}>
          Add your first service to start accepting bookings
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(service => (
          <ServiceCard
            key={service._id}
            service={service}
            onRemove={id => setServices(s => s.filter(x => x._id !== id))}
            onUpdate={handleAddOrUpdate}
          />
        ))}
      </div>

      {open && (
        <AddServiceForm
          open={open}
          onClose={() => setOpen(false)}
          onAdd={handleAddOrUpdate}
        />
      )}
    </div>
  );
}
