"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";

interface Staff {
  _id: string;
  name: string;
}

interface Service {
  _id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  gallery: string[];
}

interface Template {
  name: string;
  durationMinutes: number;
  price?: number;
}

const SERVICE_TEMPLATES: Record<string, Template[]> = {
  hair: [
    { name: "Haircut", durationMinutes: 45, price: 600 },
    { name: "Braids", durationMinutes: 180, price: 3000 },
    { name: "Blowdry", durationMinutes: 30, price: 400 },
  ],
  barber: [
    { name: "Fade Cut", durationMinutes: 40, price: 500 },
    { name: "Beard Trim", durationMinutes: 20, price: 300 },
  ],
  beauty: [
    { name: "Makeup", durationMinutes: 90, price: 2500 },
    { name: "Lashes", durationMinutes: 120, price: 2000 },
  ],
  spa: [
    { name: "Massage", durationMinutes: 60, price: 3500 },
    { name: "Facial", durationMinutes: 60, price: 3000 },
  ],
};

export default function ServiceSetup() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    durationMinutes: 60,
    price: "",
    gallery: [] as string[],
    staffIds: [] as string[],
  });

  async function fetchData() {
    const [serviceRes, staffRes] = await Promise.all([
      axios.get("/api/services"),
      axios.get("/api/staff"),
    ]);

    setServices(serviceRes.data.services || []);
    setStaff(staffRes.data.staff || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function applyTemplate(t: Template) {
    setForm({
      ...form,
      name: t.name,
      durationMinutes: t.durationMinutes,
      price: t.price?.toString() || "",
    });
  }

  async function createService() {
    if (!form.name || !form.staffIds.length) {
      alert("Service name and at least one staff member are required.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/services", {
        name: form.name,
        duration: form.durationMinutes,
        price: form.price ? Number(form.price) : undefined,
        gallery: form.gallery,
        staffIds: form.staffIds,
      });

      setForm({
        name: "",
        durationMinutes: 60,
        price: "",
        gallery: [],
        staffIds: [],
      });

      fetchData();
    } finally {
      setLoading(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    await axios.delete(`/api/services/${id}`);
    fetchData();
  }

  return (
    <div className="bg-white/90 rounded-[32px] shadow-xl p-10 space-y-8">

      <div>
        <h2 className="text-3xl font-serif text-[#001524]">
          Services
        </h2>
        <p className="text-[#15616D]">
          Add your starter services and pricing.
        </p>
      </div>

      {services.length > 0 && (
        <div className="space-y-4">
          {services.map((s) => (
            <div
              key={s._id}
              className="bg-[#FFF6ED] rounded-2xl p-5 flex justify-between shadow-sm"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-gray-600">
                  {s.durationMinutes} mins
                  {s.price && (
                    <span className="text-[#FF7D00] font-semibold ml-2">
                      · KES {s.price}
                    </span>
                  )}
                </p>
              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteService(s._id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-6 space-y-4">
        <Input
          placeholder="Service name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <Input
          type="number"
          placeholder="Duration of service(minutes)"
          value={form.durationMinutes}
          onChange={(e) =>
            setForm({
              ...form,
              durationMinutes: Number(e.target.value),
            })
          }
        />

        <Input
          type="number"
          placeholder="Price (optional)"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
        />

        <ImageUpload
          value={form.gallery}
          onChange={(urls) =>
            setForm({ ...form, gallery: urls })
          }
        />

        <Button
          onClick={createService}
          disabled={loading}
          className="bg-[#FF7D00] text-white rounded-full"
        >
          Add Service
        </Button>
      </div>
    </div>
  );
}