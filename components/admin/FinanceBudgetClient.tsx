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

type SettlementWallet = {
  walletId: string;
  label: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  canDisburse: boolean;
  isClearing: boolean;
  inflow: number;
  outflow: number;
  transactionCount: number;
  syncedAt: string;
};

type SettlementTransaction = {
  invoice?: string;
  created_at?: string;
  narrative?: string;
  value?: number;
  running_balance?: number;
};

export default function FinanceBudgetClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expenditure[]>([]);
  const [settlementWallet, setSettlementWallet] = useState<SettlementWallet | null>(null);
  const [settlementTransactions, setSettlementTransactions] = useState<SettlementTransaction[]>([]);
  const [settlementError, setSettlementError] = useState("");
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
    setSettlementWallet(data.settlementWallet || null);
    setSettlementTransactions(data.settlementTransactions || []);
    setSettlementError(data.settlementWalletError || "");
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

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <div>
          <h2 className="text-xl font-semibold">IntaSend Settlement Wallet</h2>
          <p className="text-sm text-gray-600">
            Wallet ID: {settlementWallet?.walletId || "YMW25P0"}
          </p>
          {settlementWallet?.syncedAt && (
            <p className="text-xs text-gray-500">
              Last sync: {new Date(settlementWallet.syncedAt).toLocaleString()}
            </p>
          )}
        </div>

        {settlementError && (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {settlementError}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Current Balance</p>
            <p className="text-lg font-semibold">
              {settlementWallet?.currency || "KES"}{" "}
              {Number(settlementWallet?.currentBalance || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Available Balance</p>
            <p className="text-lg font-semibold">
              {settlementWallet?.currency || "KES"}{" "}
              {Number(settlementWallet?.availableBalance || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Inflow</p>
            <p className="text-lg font-semibold text-emerald-700">
              {settlementWallet?.currency || "KES"}{" "}
              {Number(settlementWallet?.inflow || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Outflow</p>
            <p className="text-lg font-semibold text-rose-700">
              {settlementWallet?.currency || "KES"}{" "}
              {Number(settlementWallet?.outflow || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-3 text-sm">
            <p>
              <strong>Status:</strong>{" "}
              {settlementWallet?.isClearing ? "Clearing" : "Available"}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p>
              <strong>Can Disburse:</strong>{" "}
              {settlementWallet?.canDisburse ? "Yes" : "No"}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p>
              <strong>Transactions:</strong>{" "}
              {Number(settlementWallet?.transactionCount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Recent Settlement Transactions</h3>
          {settlementTransactions.length === 0 ? (
            <p className="text-sm text-gray-500">No settlement transactions returned.</p>
          ) : (
            settlementTransactions.map((txn, index) => (
              <div key={`${txn.invoice || "txn"}-${txn.created_at || index}`} className="rounded border p-3 text-sm">
                <p>
                  <strong>Amount:</strong> {settlementWallet?.currency || "KES"}{" "}
                  {Number(txn.value || 0).toLocaleString()}
                </p>
                <p>
                  <strong>Balance:</strong> {settlementWallet?.currency || "KES"}{" "}
                  {Number(txn.running_balance || 0).toLocaleString()}
                </p>
                <p>
                  <strong>Narrative:</strong> {txn.narrative || "No narrative"}
                </p>
                <p>
                  <strong>Invoice:</strong> {txn.invoice || "N/A"}
                </p>
                <p className="text-gray-500">
                  {txn.created_at ? new Date(txn.created_at).toLocaleString() : "Unknown date"}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

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
