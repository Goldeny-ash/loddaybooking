import FinanceBudgetClient from "@/components/admin/FinanceBudgetClient";

export default function AdminFinancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Finance & Budget</h1>
      <FinanceBudgetClient />
    </div>
  );
}
