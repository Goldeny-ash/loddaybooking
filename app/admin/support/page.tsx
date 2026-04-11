import SupportInboxClient from "@/components/admin/SupportInboxClient";

export default function AdminSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Platform admin
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Support inbox</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Continue customer conversations started from the floating support chat anywhere on the site.
        </p>
      </div>

      <SupportInboxClient />
    </div>
  );
}
