"use client";

import { useState, useEffect } from "react";
import StaffAvailability from "./StaffAvailability";
import ImageUpload from "@/components/ImageUpload";
import ThemedPopup from "@/components/ThemedPopup";
import Image from "next/image";

interface Staff {
  _id: string;
  name: string;
  role?: string;
  photo?: string;
  weeklyAvailability: Record<
    string,
    { start: string; end: string; closed: boolean }
  >;
  services?: string[];
  email?: string;
  phone?: string;



}

interface Service {
  _id: string;
  name: string;
  basePrice?: number;
  durationMinutes?: number;
}

interface Props {
  staffList: Staff[];
  services: Service[];
}

export default function StaffOverview({
  staffList: initialStaff,
  services,
}: Props) {
  const NEW_STAFF_ID = "__new_staff__";
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availability, setAvailability] = useState<
    Record<string, Record<string, { start: string; end: string; closed: boolean }>>
  >({});
  
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<Staff>>({});

  const [openAdd, setOpenAdd] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
  name: "",
  email: "",
  phone: "",
  role: "",
 
  photo: "",
  services: [],
  weeklyAvailability: {},
});

const [popup, setPopup] = useState<string | null>(null);

const showPopup = (message: string) => {
  setPopup(message);
};

  const selectedNewStaffServices = newStaff.services || [];

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    setStaff(initialStaff);

    const availMap: typeof availability = {};

    initialStaff.forEach(s => {
      availMap[s._id] = s.weeklyAvailability || {};
    });

    setAvailability(availMap);
  }, [initialStaff]);

  /* ---------------- OPEN EDIT ---------------- */

const openEdit = (id: string) => {
  const s = staff.find(x => x._id === id);
  if (!s) return;

  setFormState({
    ...s,
    services: s.services || [],
  });

  // 🔥 IMPORTANT: sync availability state
  setAvailability(prev => ({
    ...prev,
    [id]: s.weeklyAvailability || {},
  }));

  setOpenCard(id);
};


  const closeEdit = () => {
    setOpenCard(null);
    setFormState({});
  };

  /* ---------------- SAVE EDIT ---------------- */

  const saveEdit = async () => {
    if (!formState._id) return;
    if (!isKenyanPhone(formState.phone)) {
  return showPopup("Enter valid Kenyan phone number (07XXXXXXXX or +2547XXXXXXXX)");
}

if (!isValidEmail(formState.email)) {
  return showPopup("Enter valid email address");
}
    const previousServices =
      staff.find((s) => s._id === formState._id)?.services || [];
    const nextServices = formState.services || [];
    const addedServices = nextServices.filter(
      (id) => !previousServices.includes(id)
    );

    try {
      const res = await fetch(`/api/staff/${formState._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          services: formState.services,
          weeklyAvailability: availability[formState._id],
          photo: formState.photo,
          role: formState.role,
          
        }),
      });

      const data = await res.json();

      if (!data.staff) throw new Error();

      setStaff(prev =>
        prev.map(s => (s._id === data.staff._id ? data.staff : s))
      );

     if (addedServices.length) {
  showPopup("Service connected to staff");
} else {
  showPopup("Staff updated successfully");
}
      closeEdit();
    } catch {
      showPopup("Update failed");
    }
  };
const deleteStaff = async () => {
  if (!formState._id) return;

  if (!confirm("Delete this staff member permanently?")) return;

  try {
    const res = await fetch(`/api/staff/${formState._id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!data.success) throw new Error();

    setStaff(prev => prev.filter(s => s._id !== formState._id));

   showPopup("Staff deleted successfully");
    closeEdit();
  } catch {
    showPopup("Failed to delete staff");
  }
};

  /* ---------------- ADD STAFF ---------------- */

  const createStaff = async () => {
    if (!newStaff.name) {
  return showPopup("Staff name is required");
}

if (!isKenyanPhone(newStaff.phone)) {
  return showPopup("Enter valid Kenyan phone number (07XXXXXXXX or +2547XXXXXXXX)");
}

if (!isValidEmail(newStaff.email)) {
  return showPopup("Enter valid email address");
}

    try {
      const weeklyAvailability = availability[NEW_STAFF_ID] || {};
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStaff, weeklyAvailability }),
      });

      const data = await res.json();

      if (!data.staff) throw new Error();

      setStaff(prev => [...prev, data.staff]);
      setOpenAdd(false);
      setNewStaff({
        name: "",
        email: "",
        phone: "",
        role: "",
        photo: "",
        services: [],
        weeklyAvailability: {},
      });
      setAvailability((prev) => {
        const updated = { ...prev };
        delete updated[NEW_STAFF_ID];
        return updated;
      });

    showPopup("New staff added successfully");
    } catch {
      showPopup("Failed to create staff");
    }
  };

  /* ---------------- SERVICE TOGGLE ---------------- */

  const toggleService = (serviceId: string) => {
    setFormState(prev => {
      const current = prev.services || [];
      return {
        ...prev,
        services: current.includes(serviceId)
          ? current.filter(s => s !== serviceId)
          : [...current, serviceId],
      };
    });
  };

  const toggleNewStaffService = (serviceId: string) => {
    setNewStaff((prev) => {
      const current = prev.services || [];
      return {
        ...prev,
        services: current.includes(serviceId)
          ? current.filter((id) => id !== serviceId)
          : [...current, serviceId],
      };
    });
  };
const isKenyanPhone = (phone?: string) => {
  if (!phone) return true; // allow empty
  return /^(\+2547\d{8}|07\d{8})$/.test(phone);
};

const isValidEmail = (email?: string) => {
  if (!email) return true; // allow empty
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
  /* ================= RENDER ================= */

  return (
    <div className="p-4 rounded shadow space-y-4 bg-[var(--brand-bg-soft)] border border-[var(--brand-primary)]">
      <h2 className="text-lg font-bold text-[var(--brand-primary-dark)]">
        Staff Management
      </h2>

      {/* ADD STAFF */}
      <button
        onClick={() => {
  
  setOpenAdd(true);
}}

        className="px-4 py-2 rounded bg-[var(--brand-primary)] text-white font-medium"
      >
        + Add Staff
      </button>

      {/* STAFF CARDS */}
      {staff.map(s => (
        <div
          key={s._id}
          onClick={() => openEdit(s._id)}
          className="p-3 border rounded cursor-pointer hover:bg-gray-50"
          style={{ borderColor: "var(--brand-primary)" }}
        >
          <div className="flex gap-3 items-center">
           {s.photo && (
  <Image
    src={s.photo}
    alt={`${s.name} profile`}
    width={48}
    height={48}
    className="w-12 h-12 rounded-full object-cover"
  />
)}


            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-gray-600">{s.email}</p>
              <p className="text-sm text-gray-600">{s.phone}</p>
              <p className="text-sm text-gray-600">{s.role}</p>
             
              
            </div>
          </div>
        </div>
      ))}

      {/* ADD MODAL */}
      {openAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center pt-12">
         <div className="bg-white p-6 rounded-xl w-[92vw] max-w-[420px] space-y-3 max-h-[90vh] overflow-y-auto">

            <h3 className="font-bold text-lg">Add Staff</h3>

            <input
              value={newStaff.name || ""}
              onChange={e =>
                setNewStaff(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Name"
              className="border p-2 w-full rounded"
            />

            <input
              value={newStaff.email || ""}
              onChange={e =>
                setNewStaff(prev => ({ ...prev, email: e.target.value }))
              }
              placeholder="Email"
              className="border p-2 w-full rounded"
            />

            <input
              value={newStaff.phone || ""}
              onChange={e =>
                setNewStaff(prev => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Phone"
              className="border p-2 w-full rounded"
            />
<input
  value={newStaff.role || ""}
  onChange={e =>
    setNewStaff(prev => ({ ...prev, role: e.target.value }))
  }
  placeholder="Role (e.g. stylist, barber)"
  className="border p-2 w-full rounded"
/>



           <ImageUpload
  value={newStaff.photo ? [newStaff.photo] : []}
  onChange={urls =>
    setNewStaff(prev => ({ ...prev, photo: urls[0] || "" }))
  }
  maxFiles={1}
/>

             <StaffAvailability
              staffId={NEW_STAFF_ID}
              availability={availability}
              setAvailability={setAvailability}
            />

            <div>
              <p className="font-semibold text-sm mb-1">Assign Services</p>
              <p className="text-xs text-gray-600 mb-2">
                Pick the services this staff member can perform ({selectedNewStaffServices.length} selected).
              </p>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => {
                  const assigned = selectedNewStaffServices.includes(service._id);
                  return (
                    <button
                      key={service._id}
                      type="button"
                      onClick={() => toggleNewStaffService(service._id)}
                      className={`px-3 py-2 rounded text-left text-sm border ${
                        assigned
                          ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                          : "bg-white text-gray-800 border-gray-300"
                      }`}
                    >
                      <span className="block font-medium">{service.name}</span>
                      <span className="block text-xs opacity-80">
                        KES {service.basePrice ?? 0} • {service.durationMinutes ?? 0} min
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>


            <div className="flex gap-2 pt-2">
              <button
                onClick={createStaff}
                className="flex-1 bg-[var(--brand-primary)] text-white rounded py-2"
              >
                Add
              </button>


              <button
                onClick={() => setOpenAdd(false)}
                className="flex-1 bg-gray-200 rounded py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {openCard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center pt-12">
          <div className="bg-white p-6 rounded-xl w-[94vw] max-w-[450px] space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Edit Staff</h3>

            <input
              value={formState.name || ""}
              onChange={e =>
                setFormState(prev => ({ ...prev, name: e.target.value }))
              }
              className="border p-2 w-full rounded"
            />

            <input
              value={formState.email || ""}
              onChange={e =>
                setFormState(prev => ({ ...prev, email: e.target.value }))
              }
              className="border p-2 w-full rounded"
            />

            <input
              value={formState.phone || ""}
              onChange={e =>
                setFormState(prev => ({ ...prev, phone: e.target.value }))
              }
              className="border p-2 w-full rounded"
            />
<input
  value={formState.role || ""}
  onChange={e =>
    setFormState(prev => ({ ...prev, role: e.target.value }))
  }
  placeholder="Role (e.g. stylist, barber)"
  title="Type the person's job title"
  className="border p-2 w-full rounded"
/>



            <div>
              <p className="font-semibold text-sm mb-1">Assign Services</p>
              <p className="text-xs text-gray-600 mb-2">
                Select all services this staff member can perform ({formState.services?.length || 0} selected).
              </p>
              <div className="flex flex-wrap gap-2">
                {services.map(service => {
                  const assigned =
                    formState.services?.includes(service._id);
                  return (
                    <button
                      key={service._id}
                      onClick={() => toggleService(service._id)}
                      className={`px-3 py-1 rounded text-sm ${
                        assigned
                          ? "bg-[var(--brand-primary)] text-white"
                          : "border"
                      }`}
                    >
                      <span className="block font-medium">{service.name}</span>
                      <span className="block text-xs opacity-80">
                        Base: KES {service.basePrice ?? 0}
                      </span>
                      <span className="block text-xs opacity-80">
                        Duration: {service.durationMinutes ?? 0} min
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <StaffAvailability
              staffId={formState._id!}
              availability={availability}
              setAvailability={setAvailability}
            />

            <ImageUpload
  value={formState.photo ? [formState.photo] : []}
  onChange={urls =>
    setFormState(prev => ({ ...prev, photo: urls[0] || "" }))
  }
  maxFiles={1}
/>


            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="flex-1 bg-[var(--brand-primary)] text-white rounded py-2"
              >
                Save
              </button>
<button
  onClick={deleteStaff}
  className="flex-1 bg-red-600 text-white rounded py-2"
>
  Delete
</button>
              <button
                onClick={closeEdit}
                className="flex-1 bg-gray-200 rounded py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ThemedPopup
  message={popup}
  onClose={() => setPopup(null)}
/>
    </div>
  );
}
