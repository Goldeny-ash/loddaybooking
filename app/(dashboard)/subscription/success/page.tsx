import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SubscriptionSuccessClient from "@/components/dashboard/SubscriptionSuccessClient";

function SubscriptionSuccessFallback() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f6f0e8_38%,_#efe2d1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_25px_80px_rgba(0,21,36,0.12)] backdrop-blur">
        <div className="flex items-center gap-3 text-[#001524]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm sm:text-base">Preparing your subscription checkout...</p>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<SubscriptionSuccessFallback />}>
      <SubscriptionSuccessClient />
    </Suspense>
  );
}
