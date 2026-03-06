"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  _id: string;
  name: string;
  monthlyAllocation: number;
  color: string;
};

type Expenditure = {
  _id: string;
  amount: number;
  description: string;
  spentAt: string;
  categoryId?: { _id?: string; name?: string; color?: string };
};

export default function FinanceBudgetClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expenditure[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    monthlyAllocation: "",
    color: "#0ea5e9",
  });
  const [expenseForm, setExpenseForm] = useState({
    categoryId: "",
    amount: "",
    description: "",
  });
  const [topup, setTopup] = useState({ amount: "", phoneNumber: "" });

  const load = async () => {
    const res = await fetch("/api/admin/finance/budget");
    const data = await res.json();
    setCategories(data.categories || []);
    setExpenses(data.expenditures || []);
  };

  useEffect(() => {
    const run = async () => {
      await load();
    };
    run();
  }, []);

  const totals = useMemo(() => {
    const allocation = categories.reduce((sum, c) => sum + Number(c.monthlyAllocation || 0), 0);
    const spent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return { allocation, spent };
  }, [categories, expenses]);

  const createCategory = async () => {
    await fetch("/api/admin/finance/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "category",
        name: categoryForm.name,
        monthlyAllocation: Number(categoryForm.monthlyAllocation || 0),
        color: categoryForm.color,
      }),
    });
    setCategoryForm({ name: "", monthlyAllocation: "", color: "#0ea5e9" });
    await load();
  };

  const createExpense = async () => {
    await fetch("/api/admin/finance/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "expense",
        categoryId: expenseForm.categoryId,
        amount: Number(expenseForm.amount || 0),
        description: expenseForm.description,
      }),
    });
    setExpenseForm({ categoryId: "", amount: "", description: "" });
    await load();
  };

  const startTopup = async () => {
    const res = await fetch("/api/admin/finance/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(topup.amount || 0),
        phoneNumber: topup.phoneNumber,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json?.error || "Top-up failed");
      return;
    }
    alert("Top-up STK sent");
    setTopup({ amount: "", phoneNumber: "" });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-xl font-semibold">Budget Overview</h2>
        <p className="text-sm">Allocated: KES {totals.allocation.toLocaleString()}</p>
        <p className="text-sm">Spent: KES {totals.spent.toLocaleString()}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-xl border bg-white p-4 space-y-3">
          <h3 className="font-semibold">Create Budget Category</h3>
          <input
            placeholder="Category name (Domain, MongoDB, Vercel...)"
            className="border rounded px-3 py-2 w-full"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            placeholder="Monthly allocation"
            type="number"
            className="border rounded px-3 py-2 w-full"
            value={categoryForm.monthlyAllocation}
            onChange={(e) => setCategoryForm((p) => ({ ...p, monthlyAllocation: e.target.value }))}
          />
          <input
            type="color"
            className="w-14 h-10 border rounded"
            value={categoryForm.color}
            onChange={(e) => setCategoryForm((p) => ({ ...p, color: e.target.value }))}
          />
          <button onClick={createCategory} className="px-4 py-2 rounded bg-black text-white">
            Add Category
          </button>
        </section>

        <section className="rounded-xl border bg-white p-4 space-y-3">
          <h3 className="font-semibold">Add Expenditure</h3>
          <select
            className="border rounded px-3 py-2 w-full"
            value={expenseForm.categoryId}
            onChange={(e) => setExpenseForm((p) => ({ ...p, categoryId: e.target.value }))}
          >
            <option value="">Choose category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            className="border rounded px-3 py-2 w-full"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
          />
          <input
            placeholder="Description"
            className="border rounded px-3 py-2 w-full"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
          />
          <button onClick={createExpense} className="px-4 py-2 rounded bg-black text-white">
            Add Expense
          </button>
        </section>
      </div>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold">Top-up Platform Wallet (M-Pesa STK)</h3>
        <div className="grid md:grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Amount"
            className="border rounded px-3 py-2"
            value={topup.amount}
            onChange={(e) => setTopup((p) => ({ ...p, amount: e.target.value }))}
          />
          <input
            placeholder="Phone number"
            className="border rounded px-3 py-2"
            value={topup.phoneNumber}
            onChange={(e) => setTopup((p) => ({ ...p, phoneNumber: e.target.value }))}
          />
        </div>
        <button onClick={startTopup} className="px-4 py-2 rounded bg-emerald-600 text-white">
          Send STK Prompt
        </button>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold mb-3">Recent Expenditures</h3>
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e._id} className="border rounded p-3 text-sm">
              <p>
                <strong>{e.categoryId?.name || "Category"}</strong> - KES{" "}
                {Number(e.amount).toLocaleString()}
              </p>
              <p>{e.description}</p>
              <p className="text-gray-500">{new Date(e.spentAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
