import MarketplaceRequestsAdminClient from "@/components/admin/MarketplaceRequestsAdminClient";

export default function AdminMarketplacePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Marketplace Review Panel</h1>
      <MarketplaceRequestsAdminClient />
    </div>
  );
}
