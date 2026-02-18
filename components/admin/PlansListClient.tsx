"use client";

import { useState } from "react";

type SubscriptionPlan = {
  name: string;
  amount: number;
  currency: string;
  frequency: number;
  frequencyUnit: string;
  billingCycles?: number | null;
  planId: string;
  isActive: boolean;
};

type PlanForm = {
  name: string;
  amount: number;
  currency: string;
  frequency: number;
  frequencyUnit: string;
  billingCycles: number | "";
};

interface Props {
  plans: any[]; // normalize manually
}

/* -----------------------------
   Normalize Incoming Data
------------------------------ */
function normalizePlan(raw: any): SubscriptionPlan {
  return {
    name: String(raw.name),
    amount: Number(raw.amount),
    currency: String(raw.currency),
    frequency: Number(raw.frequency),
    frequencyUnit: String(raw.frequencyUnit),
    billingCycles:
      raw.billingCycles === null || raw.billingCycles === undefined
        ? null
        : Number(raw.billingCycles),
    planId: String(raw.planId),
    isActive: raw.isActive === true || raw.isActive === "true",
  };
}

export default function PlansListClient({ plans: initialPlans }: Props) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(
    initialPlans.map(normalizePlan)
  );

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [form, setForm] = useState<PlanForm>({
    name: "",
    amount: 0,
    currency: "KES",
    frequency: 1,
    frequencyUnit: "M",
    billingCycles: "",
  });

  /* ------------------------------ Helpers ------------------------------ */

  const parseNumber = (value: string): number =>
    value === "" ? 0 : Number(value);

  const resetForm = () => {
    setForm({
      name: "",
      amount: 0,
      currency: "KES",
      frequency: 1,
      frequencyUnit: "M",
      billingCycles: "",
    });
    setIsEditing(false);
    setEditingPlanId(null);
  };

  const refreshPlans = async () => {
    const res = await fetch("/api/admin/subscriptions/plans");

    if (!res.ok) {
      console.error("Failed to fetch plans");
      return;
    }

    const data = await res.json();
    setPlans(data.map(normalizePlan));
  };

  const disablePlan = async (planId: string) => {
    const res = await fetch(
      `/api/admin/subscriptions/plans/${planId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      console.error("Failed to disable plan");
      return;
    }

    await refreshPlans();
  };

  const openCreateModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setForm({
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      frequency: plan.frequency,
      frequencyUnit: plan.frequencyUnit,
      billingCycles: plan.billingCycles ?? "",
    });

    setEditingPlanId(plan.planId);
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name.trim(),
      amount: Number(form.amount),
      currency: form.currency,
      frequency: Number(form.frequency),
      frequencyUnit: form.frequencyUnit,
      billingCycles:
        form.billingCycles === "" ? null : Number(form.billingCycles),
    };

    const endpoint =
      isEditing && editingPlanId
        ? `/api/admin/subscriptions/plans/${editingPlanId}`
        : "/api/admin/subscriptions/plans";

    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Plan save failed:", error);
      return;
    }

    setOpen(false);
    resetForm();
    await refreshPlans();
  };

  /* ------------------------------ UI ------------------------------ */

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <button
          onClick={openCreateModal}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Create Plan
        </button>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="border-b text-left">
            <th>Name</th>
            <th>Amount</th>
            <th>Frequency</th>
            <th>Plan ID</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {plans.map((plan) => (
            <tr key={plan.planId} className="border-b">
              <td>{plan.name}</td>
              <td>
                {plan.currency} {plan.amount}
              </td>
              <td>
                Every {plan.frequency} {plan.frequencyUnit}
              </td>
              <td className="text-xs">{plan.planId}</td>
              <td>
                {plan.isActive ? (
                  <span className="text-green-600 font-medium">
                    Active
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium">
                    Disabled
                  </span>
                )}
              </td>
              <td className="space-x-3">
                <button
                  onClick={() => openEditModal(plan)}
                  className="text-blue-600"
                >
                  Edit
                </button>

                {plan.isActive && (
                  <button
                    onClick={() => disablePlan(plan.planId)}
                    className="text-red-600"
                  >
                    Disable
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[420px] space-y-4">
            <h2 className="text-lg font-semibold">
              {isEditing ? "Edit Plan" : "Create Plan"}
            </h2>

            <input
              value={form.name}
              placeholder="Plan Name"
              className="w-full border p-2"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              value={form.amount}
              type="number"
              className="w-full border p-2"
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: parseNumber(e.target.value),
                })
              }
            />

            <select
              value={form.currency}
              className="w-full border p-2"
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value })
              }
            >
              <option value="KES">KES</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>

            <input
              value={form.frequency}
              type="number"
              className="w-full border p-2"
              onChange={(e) =>
                setForm({
                  ...form,
                  frequency: parseNumber(e.target.value),
                })
              }
            />

            <select
              value={form.frequencyUnit}
              className="w-full border p-2"
              onChange={(e) =>
                setForm({
                  ...form,
                  frequencyUnit: e.target.value,
                })
              }
            >
              <option value="M">Month</option>
              <option value="Y">Year</option>
              <option value="W">Week</option>
              <option value="D">Day</option>
            </select>

            <input
              value={form.billingCycles}
              type="number"
              className="w-full border p-2"
              onChange={(e) =>
                setForm({
                  ...form,
                  billingCycles:
                    e.target.value === ""
                      ? ""
                      : Number(e.target.value),
                })
              }
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="bg-black text-white px-4 py-2 rounded"
              >
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
