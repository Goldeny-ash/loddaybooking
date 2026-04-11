import Link from "next/link";

const adminSections = [
  { name: "Affiliates", href: "/affiliates" },
  { name: "Customers", href: "/customers" },
  { name: "Finance", href: "/finance" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Refunds", href: "/refunds" },
  { name: "Support", href: "/admin/support" },
  { name: "Subscriptions", href: "/subscriptions" },
  { name: "Wallets", href: "/wallets" },
];

export default function AdminDashboardPage() {
  return (
    <div>
      {/* Optional subtitle */}
      <p className="text-gray-600 mb-6">
        Select a section to manage
      </p>

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {adminSections.map((section) => (
          <Link
            key={section.name}
            href={section.href}
            className="group rounded-xl bg-white p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="flex flex-col justify-between h-full">
              <h2 className="text-lg font-semibold text-gray-900">
                {section.name}
              </h2>

              <span className="mt-4 text-sm text-blue-600 group-hover:underline">
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
