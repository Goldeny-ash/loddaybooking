// app/admin/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isPlatformOwner())) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Platform Admin</h1>
      {children}
    </div>
  );
}
