"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CircleUserRound,
  Image,
  LayoutDashboard,
  Menu,
  QrCode,
  Scissors,
  Search,
  Tag,
  Users,
  X,
} from "lucide-react";

import StaffOverview from "./StaffOverview";
import ServicesManager from "./ServicesManager";
import PromotionForm from "./PromotionForm";
import PortfolioManager from "./PortfolioManager";
import QRCodeCard from "./QRCodeCard";
import BookingsTable from "./BookingsTable";

interface SidebarProps {
  business: any;
  staffList: any[];
  services: any[];
  bookings: any[];
  theme: any;
}

export default function Sidebar({
  business,
  staffList,
  services,
  bookings,
  theme,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");

  const navItems = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { id: "staff", label: "Staff", icon: <Users size={16} /> },
      { id: "services", label: "Services", icon: <Scissors size={16} /> },
      { id: "promotions", label: "Promotions", icon: <Tag size={16} /> },
      { id: "portfolio", label: "Portfolio", icon: <Image size={16} /> },
      { id: "qr", label: "QR Code", icon: <QrCode size={16} /> },
      { id: "bookings", label: "Bookings", icon: <Calendar size={16} /> },
    ],
    []
  );

  const closeModal = () => setActiveTab(null);
  const openTab = (tab: string) => {
    if (tab !== "dashboard") {
      setActiveTab(tab);
    }
    setActiveItem(tab);
    setMobileOpen(false);
  };

  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener("dashboard:open-sidebar", open);
    return () => window.removeEventListener("dashboard:open-sidebar", open);
  }, []);

  const SidebarContent = ({ mobile }: { mobile: boolean }) => (
    <div
      className={`h-full border-r flex flex-col ${mobile ? "p-5" : "p-5"}`}
      style={{
        borderColor: "var(--brand-primary-light)",
        backgroundColor: "#ffffff",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-9 w-9 rounded-xl grid place-content-center text-white"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <CircleUserRound size={18} />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {business?.name || "Business"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {business?.email || "owner@business.com"}
          </p>
        </div>
      </div>

      <div
        className="mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 bg-white"
        style={{ borderColor: "var(--brand-primary-light)" }}
      >
        <Search size={14} className="text-gray-400" />
        <input
          placeholder="Search"
          className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => openTab(item.id)}
            className={`w-full px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              activeItem === item.id
                ? "text-[var(--brand-primary-dark)]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            style={
              activeItem === item.id
                ? { backgroundColor: "var(--brand-bg-soft)" }
                : undefined
            }
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <div
          className="rounded-xl border px-3 py-2"
          style={{
            borderColor: "var(--brand-primary-light)",
            backgroundColor: "var(--brand-bg-soft)",
          }}
        >
          <p className="text-sm font-semibold text-gray-900 truncate">
            {business?.name || "Business Owner"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {business?.email || "owner@business.com"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block md:w-72 md:shrink-0">
        <SidebarContent mobile={false} />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <SidebarContent mobile />
        </div>
      )}

      {activeTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="relative w-[95%] h-[90%] overflow-y-auto rounded-2xl shadow-2xl border border-white/30 bg-white/70 backdrop-blur-xl p-8">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-sm px-3 py-1 bg-white rounded shadow"
            >
              Close
            </button>

            {activeTab === "staff" && (
              <StaffOverview staffList={staffList || []} services={services || []} />
            )}
            {activeTab === "services" && <ServicesManager business={business} />}
            {activeTab === "promotions" && <PromotionForm />}
            {activeTab === "portfolio" && (
              <PortfolioManager
                businessId={business._id.toString()}
                services={services || []}
                theme={theme}
              />
            )}
            {activeTab === "qr" && (
              <QRCodeCard username={business.username} business={business.name} />
            )}
            {activeTab === "bookings" && (
              <BookingsTable
                businessId={business._id.toString()}
                initialBookings={bookings}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function SidebarMenuTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("dashboard:open-sidebar"))}
      className="md:hidden rounded-lg p-2 bg-white border border-gray-100"
      aria-label="Open sidebar menu"
      title="Open menu"
    >
      <Menu size={16} style={{ color: "var(--brand-primary-dark)" }} />
    </button>
  );
}
