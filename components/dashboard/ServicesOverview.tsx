"use client";

export default function ServicesOverview({
  services,
}: {
  services: any[];
}) {
  return (
    <div
      className="p-4 rounded shadow"
      style={{ backgroundColor: "var(--brand-bg-soft)", border: "1px solid var(--brand-primary)" }}
    >
      <h2 className="text-lg font-bold mb-2" style={{ color: "var(--brand-primary-dark)" }}>
        Services Overview
      </h2>
      <ul className="space-y-2">
        {services.map((s) => (
          <li key={s._id} className="flex justify-between">
            <span style={{ color: "var(--brand-primary-dark)" }}>{s.name}</span>
            <span style={{ color: "var(--brand-accent-dark)" }} className="text-sm">
              {s.durationMinutes} min | Ksh {s.price || 0}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
