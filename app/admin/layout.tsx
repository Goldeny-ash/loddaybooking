// app/admin/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  console.log("[AdminLayout] currentUser:", user);

  if (!user?.id || user.id !== process.env.PLATFORM_OWNER_CLERK_ID) {
    console.log("[AdminLayout] Unauthorized access attempt");
    redirect("/"); // permanently redirect non-owners
  } else {
    
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Platform Admin</h1>
      {children}
    </div>
  );
}
