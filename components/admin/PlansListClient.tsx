"use client";

import { useState } from "react";

export default function PlansListClient({ plans: initialPlans }: any) {
  const [plans, setPlans] = useState(initialPlans);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    currency: "KES",
    frequency: 1,
    frequencyUnit: "M",
    billingCycles: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      amount: "",
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
    const data = await res.json();
    setPlans(data);
  };

  const disablePlan = async (planId: string) => {
    await fetch(`/api/admin/subscriptions/plans/${planId}`, {
      method: "DELETE",
    });
    refreshPlans();
  };

  const openCreateModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (plan: any) => {
    setForm({
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      frequency: plan.frequency,
      frequencyUnit: plan.frequencyUnit,
      billingCycles: plan.billingCycles || "",
    });
    setEditingPlanId(plan.planId);
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      amount: Number(form.amount),
      frequency: Number(form.frequency),
      billingCycles: form.billingCycles
        ? Number(form.billingCycles)
        : null,
    };

    let res;

    if (isEditing && editingPlanId) {
      res = await fetch(
        `/api/admin/subscriptions/plans/${editingPlanId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
    } else {
      res = await fetch("/api/admin/subscriptions/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      setOpen(false);
      resetForm();
      refreshPlans();
    }
  };

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
          {plans.map((plan: any) => (
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
              placeholder="Amount"
              type="number"
              className="w-full border p-2"
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
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
              placeholder="Frequency (e.g 1)"
              type="number"
              className="w-full border p-2"
              onChange={(e) =>
                setForm({ ...form, frequency: e.target.value })
              }
            />

            <select
              value={form.frequencyUnit}
              className="w-full border p-2"
              onChange={(e) =>
                setForm({ ...form, frequencyUnit: e.target.value })
              }
            >
              <option value="M">Month</option>
              <option value="Y">Year</option>
              <option value="W">Week</option>
              <option value="D">Day</option>
            </select>

            <input
              value={form.billingCycles}
              placeholder="Billing Cycles (optional)"
              type="number"
              className="w-full border p-2"
              onChange={(e) =>
                setForm({ ...form, billingCycles: e.target.value })
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
