"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";
import ThemedPopup from "@/components/ThemedPopup";
import StaffAvailability, { DAYS } from "./StaffAvailability";

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

interface PopupState {
  message: string;
  variant?: "success" | "error";
  mode?: "toast" | "confirm";
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

type AvailabilitySlot = { start: string; end: string; closed: boolean };

const normalizeWeeklyAvailability = (
  weeklyAvailability?: Record<string, Partial<AvailabilitySlot>>
) =>
  DAYS.reduce<Record<string, AvailabilitySlot>>((acc, day) => {
    const slot = weeklyAvailability?.[day];
    acc[day] = {
      start: slot?.start || "",
      end: slot?.end || "",
      closed: Boolean(slot?.closed),
    };
    return acc;
  }, {});

const formatDuration = (durationMinutes?: number) => {
  const total = durationMinutes ?? 0;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

const REQUIRED_MARK = <span className="text-red-500">*</span>;

const isValidEmail = (email?: string) => {
  const value = email?.trim();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isValidPhone = (phone?: string) => {
  const value = phone?.trim();
  if (!value) return false;
  const normalized = value.replace(/[\s()-]/g, "");

  if (normalized.startsWith("+")) {
    return /^\+[1-9]\d{7,14}$/.test(normalized);
  }

  return /^\d{7,15}$/.test(normalized);
};

export default function StaffOverview({
  staffList: initialStaff,
  services,
}: Props) {
  const NEW_STAFF_ID = "__new_staff__";
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availability, setAvailability] = useState<
    Record<string, Record<string, AvailabilitySlot>>
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
  const [popup, setPopup] = useState<PopupState | null>(null);

  const showPopup = (next: PopupState) => {
    setPopup(next);
  };

  const selectedNewStaffServices = newStaff.services || [];

  useEffect(() => {
    setStaff(initialStaff);

    const availMap: typeof availability = {};
    initialStaff.forEach((s) => {
      availMap[s._id] = normalizeWeeklyAvailability(s.weeklyAvailability);
    });
    setAvailability(availMap);
  }, [initialStaff]);

  const hasValidWeeklyAvailability = (staffId: string) => {
    const slots = availability[staffId] || {};

    return DAYS.every((day) => {
      const daySlot = slots[day];
      if (!daySlot) return false;
      if (daySlot.closed) return true;
      return Boolean(daySlot.start && daySlot.end);
    });
  };

  const validateRequiredFields = (candidate: Partial<Staff>, staffId: string) => {
    if (!candidate.name?.trim()) {
      return "Name is required.";
    }
    if (!candidate.email?.trim()) {
      return "Email is required.";
    }
    if (!candidate.phone?.trim()) {
      return "Phone number is required.";
    }
    if (!candidate.services || candidate.services.length === 0) {
      return "Assign at least one service. This is required so service availability can appear to customers.";
    }
    if (!hasValidWeeklyAvailability(staffId)) {
      return "Set availability for all days (or mark a day as closed).";
    }
    return null;
  };

  const openEdit = (id: string) => {
    const selected = staff.find((x) => x._id === id);
    if (!selected) return;

    setFormState({
      ...selected,
      services: selected.services || [],
    });

    setAvailability((prev) => ({
      ...prev,
      [id]: normalizeWeeklyAvailability(selected.weeklyAvailability),
    }));

    setOpenCard(id);
  };

  const closeEdit = () => {
    setOpenCard(null);
    setFormState({});
  };

  const saveEdit = async () => {
    if (!formState._id) return;

    const missingFieldMessage = validateRequiredFields(formState, formState._id);
    if (missingFieldMessage) {
      return showPopup({
        message: missingFieldMessage,
        variant: "error",
      });
    }

    if (!isValidEmail(formState.email)) {
      return showPopup({
        message: "Please enter a valid email address.",
        variant: "error",
      });
    }

    if (!isValidPhone(formState.phone)) {
      return showPopup({
        message: "Please enter a valid phone number.",
        variant: "error",
      });
    }

    const previousServices = staff.find((s) => s._id === formState._id)?.services || [];
    const nextServices = formState.services || [];
    const addedServices = nextServices.filter((id) => !previousServices.includes(id));

    try {
      const res = await fetch(`/api/staff/${formState._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name?.trim(),
          email: formState.email?.trim(),
          phone: formState.phone?.trim(),
          services: formState.services,
          weeklyAvailability: availability[formState._id],
          photo: formState.photo,
          role: formState.role?.trim(),
        }),
      });

      const data = await res.json();
      if (!data.staff) throw new Error();

      setStaff((prev) => prev.map((s) => (s._id === data.staff._id ? data.staff : s)));

      showPopup({
        message: addedServices.length ? "Service connected to staff." : "Staff updated successfully.",
        variant: "success",
      });
      closeEdit();
    } catch {
      showPopup({
        message: "Update failed.",
        variant: "error",
      });
    }
  };

  const deleteStaff = () => {
    if (!formState._id) return;

    showPopup({
      mode: "confirm",
      variant: "error",
      title: "Delete Staff",
      message: "Are you sure you want to delete this staff member?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        const deletingId = formState._id;
        setPopup(null);

        try {
          const res = await fetch(`/api/staff/${deletingId}`, {
            method: "DELETE",
          });

          const data = await res.json();
          if (!data.success) throw new Error();

          setStaff((prev) => prev.filter((s) => s._id !== deletingId));
          showPopup({
            message: "Staff deleted successfully.",
            variant: "success",
          });
          closeEdit();
        } catch {
          showPopup({
            message: "Failed to delete staff.",
            variant: "error",
          });
        }
      },
    });
  };

  const createStaff = async () => {
    const missingFieldMessage = validateRequiredFields(newStaff, NEW_STAFF_ID);
    if (missingFieldMessage) {
      return showPopup({
        message: missingFieldMessage,
        variant: "error",
      });
    }

    if (!isValidEmail(newStaff.email)) {
      return showPopup({
        message: "Please enter a valid email address.",
        variant: "error",
      });
    }

    if (!isValidPhone(newStaff.phone)) {
      return showPopup({
        message: "Please enter a valid phone number.",
        variant: "error",
      });
    }

    try {
      const weeklyAvailability = availability[NEW_STAFF_ID] || {};
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStaff,
          name: newStaff.name?.trim(),
          email: newStaff.email?.trim(),
          phone: newStaff.phone?.trim(),
          role: newStaff.role?.trim(),
          weeklyAvailability,
        }),
      });

      const data = await res.json();
      if (!data.staff) throw new Error();

      setStaff((prev) => [...prev, data.staff]);
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

      showPopup({
        message: "New staff added successfully.",
        variant: "success",
      });
    } catch {
      showPopup({
        message: "Failed to create staff.",
        variant: "error",
      });
    }
  };

  const toggleService = (serviceId: string) => {
    setFormState((prev) => {
      const current = prev.services || [];
      return {
        ...prev,
        services: current.includes(serviceId)
          ? current.filter((s) => s !== serviceId)
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

  return (
    <div className="p-4 rounded shadow space-y-4 bg-[var(--brand-bg-soft)] border border-[var(--brand-primary)]">
      <h2 className="text-lg font-bold text-[var(--brand-primary-dark)]">Staff Management</h2>

      <button
        onClick={() => setOpenAdd(true)}
        className="px-4 py-2 rounded bg-[var(--brand-primary)] text-white font-medium"
      >
        + Add Staff
      </button>

      {staff.map((s) => (
        <div
          key={s._id}
          onClick={() => openEdit(s._id)}
          className="p-3 border rounded cursor-pointer hover:bg-gray-50"
          style={{ borderColor: "var(--brand-primary)" }}
        >
          <div className="flex gap-3 items-center">
            {s.photo ? (
              <Image
                src={s.photo}
                alt={`${s.name} profile`}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : null}

            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-gray-600">{s.email}</p>
              <p className="text-sm text-gray-600">{s.phone}</p>
              <p className="text-sm text-gray-600">{s.role}</p>
            </div>
          </div>
        </div>
      ))}

      {openAdd ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center pt-12">
          <div className="bg-white p-6 rounded-xl w-[92vw] max-w-[420px] space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Add Staff</h3>

            <label className="text-sm font-medium block">
              Name {REQUIRED_MARK}
              <input
                value={newStaff.name || ""}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
                className="border p-2 w-full rounded mt-1"
              />
            </label>

            <label className="text-sm font-medium block">
              Email {REQUIRED_MARK}
              <input
                type="email"
                value={newStaff.email || ""}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                inputMode="email"
                className="border p-2 w-full rounded mt-1"
              />
            </label>

            <label className="text-sm font-medium block">
              Phone Number {REQUIRED_MARK}
              <input
                type="tel"
                value={newStaff.phone || ""}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                inputMode="tel"
                className="border p-2 w-full rounded mt-1"
              />
            </label>

            <label className="text-sm font-medium block">
              Role (Optional)
              <input
                value={newStaff.role || ""}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Role (e.g. stylist, barber)"
                className="border p-2 w-full rounded mt-1"
              />
            </label>

            <div>
              <p className="text-sm font-medium">Staff Photo</p>
              <p className="text-xs text-gray-600 mb-2">Add an optional photo for this staff member.</p>
              <ImageUpload
                value={newStaff.photo ? [newStaff.photo] : []}
                onChange={(urls) => setNewStaff((prev) => ({ ...prev, photo: urls[0] || "" }))}
                maxFiles={1}
              />
            </div>

            <StaffAvailability
              staffId={NEW_STAFF_ID}
              availability={availability}
              setAvailability={setAvailability}
            />

            <div>
              <p className="font-semibold text-sm mb-1">Assign Services (Required)</p>
              <p className="text-xs text-gray-600 mb-2">
                Required: without staff assigned to a service, that service availability will not show.
              </p>
              <p className="text-xs text-gray-600 mb-2">
                {selectedNewStaffServices.length} selected.
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
                        Duration: {formatDuration(service.durationMinutes)}
                      </span>
                      <span className="block text-xs opacity-80">Cost: Dynamic</span>
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
      ) : null}

      {openCard ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center pt-12">
          <div className="bg-white p-6 rounded-xl w-[94vw] max-w-[450px] space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Edit Staff</h3>

            <label className="text-sm font-medium block">
              Name {REQUIRED_MARK}
              <input
                value={formState.name || ""}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                className="border p-2 w-full rounded mt-1"
              />
            </label>

            <label className="text-sm font-medium block">
              Email {REQUIRED_MARK}
              <input
                type="email"
                value={formState.email || ""}
                onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                inputMode="email"
                className="border p-2 w-full rounded mt-1"
              />
            </label>

            <label className="text-sm font-medium block">
              Phone Number {REQUIRED_MARK}
              <input
                type="tel"
                value={formState.phone || ""}
                onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))}
                inputMode="tel"
                className="border p-2 w-full rounded mt-1"
              />
            </label>

            <label className="text-sm font-medium block">
              Role (Optional)
              <input
                value={formState.role || ""}
                onChange={(e) => setFormState((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Role (e.g. stylist, barber)"
                className="border p-2 w-full rounded mt-1"
              />
            </label>

            <div>
              <p className="font-semibold text-sm mb-1">Assign Services (Required)</p>
              <p className="text-xs text-gray-600 mb-2">
                Required: without staff assigned to a service, that service availability will not show.
              </p>
              <p className="text-xs text-gray-600 mb-2">
                {(formState.services?.length || 0)} selected.
              </p>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => {
                  const assigned = formState.services?.includes(service._id);
                  return (
                    <button
                      key={service._id}
                      type="button"
                      onClick={() => toggleService(service._id)}
                      className={`px-3 py-2 rounded text-left text-sm border ${
                        assigned
                          ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                          : "bg-white text-gray-800 border-gray-300"
                      }`}
                    >
                      <span className="block font-medium">{service.name}</span>
                      <span className="block text-xs opacity-80">
                        Duration: {formatDuration(service.durationMinutes)}
                      </span>
                      <span className="block text-xs opacity-80">Cost: Dynamic</span>
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

            <div>
              <p className="text-sm font-medium">Staff Photo</p>
              <p className="text-xs text-gray-600 mb-2">Add an optional photo for this staff member.</p>
              <ImageUpload
                value={formState.photo ? [formState.photo] : []}
                onChange={(urls) => setFormState((prev) => ({ ...prev, photo: urls[0] || "" }))}
                maxFiles={1}
              />
            </div>

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
              <button onClick={closeEdit} className="flex-1 bg-gray-200 rounded py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ThemedPopup
        message={popup?.message ?? null}
        onClose={() => setPopup(null)}
        variant={popup?.variant || "success"}
        mode={popup?.mode || "toast"}
        title={popup?.title}
        confirmText={popup?.confirmText}
        cancelText={popup?.cancelText}
        onConfirm={popup?.onConfirm}
      />
    </div>
  );
}
