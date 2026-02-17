"use client";

import { useState } from "react";
import {
  Users,
  Scissors,
  Tag,
  Image,
  QrCode,
  Calendar,
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

  const closeModal = () => setActiveTab(null);

  return (
    <>
      {/* LEFT PANEL */}
      <div className="w-64 min-h-screen border-r bg-white p-4 space-y-4">
        <h2 className="font-bold text-lg mb-6">Management</h2>

        <SidebarButton icon={<Users size={16} />} onClick={() => setActiveTab("staff")}>
          Staff
        </SidebarButton>

        <SidebarButton icon={<Scissors size={16} />} onClick={() => setActiveTab("services")}>
          Services
        </SidebarButton>

        <SidebarButton icon={<Tag size={16} />} onClick={() => setActiveTab("promotions")}>
          Promotions
        </SidebarButton>

        <SidebarButton icon={<Image size={16} />} onClick={() => setActiveTab("portfolio")}>
          Portfolio
        </SidebarButton>

        <SidebarButton icon={<QrCode size={16} />} onClick={() => setActiveTab("qr")}>
          QR Code
        </SidebarButton>

        <SidebarButton icon={<Calendar size={16} />} onClick={() => setActiveTab("bookings")}>
          Bookings
        </SidebarButton>
      </div>

      {/* FULLSCREEN GLASS MODAL */}
      {activeTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          
          <div className="relative w-[95%] h-[90%] overflow-y-auto rounded-2xl shadow-2xl border border-white/30 bg-white/70 backdrop-blur-xl p-8">
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-sm px-3 py-1 bg-white rounded shadow"
            >
              Close
            </button>

            {/* CONTENT */}
            {activeTab === "staff" && (
              <StaffOverview
                staffList={staffList || []}
                services={services || []}
              />
            )}

            {activeTab === "services" && (
              <ServicesManager business={business} />
            )}

            {activeTab === "promotions" && (
              <PromotionForm />
            )}

            {activeTab === "portfolio" && (
              <PortfolioManager
                businessId={business._id.toString()}
                services={services || []}
                theme={theme}
              />
            )}

            {activeTab === "qr" && (
              <QRCodeCard
                username={business.username}
                business={business.name}
              />
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

function SidebarButton({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition"
    >
      {icon}
      {children}
    </button>
  );
}