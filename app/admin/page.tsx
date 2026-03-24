import Link from "next/link";

const adminSections = [
  {
    name: "Affiliates",
    href: "/admin/affiliates",
    description: "Manage affiliate users and performance",
  },
  {
    name: "Customers",
    href: "/admin/customers",
    description: "View and manage customers",
  },
  {
    name: "Finance",
    href: "/admin/finance",
    description: "Track revenue and financial data",
  },
  {
    name: "Marketplace",
    href: "/admin/marketplace",
    description: "Manage marketplace listings",
  },
  {
    name: "Refunds",
    href: "/admin/refunds",
    description: "Handle refund requests",
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    description: "Monitor subscriptions",
  },
  {
    name: "Wallets",
    href: "/admin/wallets",
    description: "Manage wallets and balances",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage all aspects of your platform
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {adminSections.map((section) => (
          <Link
            key={section.name}
            href={section.href}
            className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="flex flex-col h-full justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-black">
                  {section.name}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  {section.description}
                </p>
              </div>

              <div className="mt-6 text-sm font-medium text-blue-600 group-hover:underline">
                Open →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}