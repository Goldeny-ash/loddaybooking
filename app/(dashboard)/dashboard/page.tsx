import { getCurrentBusiness } from "@/lib/getCurrentBusiness";
import Booking from "@/lib/models/Booking";
import Staff from "@/lib/models/Staff";
import Service from "@/lib/models/Service";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardAlerts from "@/components/dashboard/DashboardAlerts";

import TodaysSchedule from "@/components/dashboard/TodaysSchedule";
import RevenuePanel from "@/components/dashboard/RevenuePanel";
import StatsCards from "@/components/dashboard/StatsCards";
import BookingLinkCard from "@/components/dashboard/BookingLinkCard";
import UpcomingBookings from "@/components/dashboard/bookings/UpcomingBookings";
import BusinessSettingsDrawe from "@/components/dashboard/BusinessSettingsDrawe";
import Sidebar from "@/components/dashboard/SideBar";
import PerformanceChart from "@/components/dashboard/PerformanceChart";

export default async function DashboardPage() {
  const business = await getCurrentBusiness({ requireSetup: true });
  if (!business) return null;

  const [bookingsRaw, staffRaw, servicesRaw] = await Promise.all([
    Booking.find({ businessId: business._id })
      .populate({ path: "serviceId", strictPopulate: false })
      .populate({ path: "staffId", strictPopulate: false })
      .lean(),
    Staff.find({ businessId: business._id }).lean(),
    Service.find({ businessId: business._id }).lean(),
  ]);

  const servicesMap = Object.fromEntries(
    servicesRaw.map((s) => [s._id.toString(), s])
  );

  const staffMap = Object.fromEntries(
    staffRaw.map((s) => [s._id.toString(), s])
  );

  const bookings = bookingsRaw.map((b) => ({
    ...b,
    _id: b._id.toString(),
    serviceId: b.serviceId
      ? { ...b.serviceId, _id: b.serviceId._id.toString() }
      : b.serviceId && servicesMap[b.serviceId.toString()],
    staffId: b.staffId
      ? { ...b.staffId, _id: b.staffId._id.toString() }
      : b.staffId && staffMap[b.staffId.toString()],
  }));

  const staffList = staffRaw.map((s) => ({
    ...s,
    _id: s._id.toString(),
  }));

  const services = servicesRaw.map((s) => ({
    ...s,
    _id: s._id.toString(),
  }));

  const theme = {
    primaryColor: business.theme?.primaryColor || "#1f2937",
    secondaryColor: business.theme?.secondaryColor || "#374151",
    accentColor: business.theme?.accentColor || "#3b82f6",
    brandBgSoft: business.theme?.brandBgSoft || "#f9fafb",
  };

  return (
    <div className="flex">

      {/* SIDEBAR (UNCHANGED) */}
      <Sidebar
        business={business}
        staffList={staffList}
        services={services}
        bookings={bookings}
        theme={theme}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <DashboardHeader
          business={business}
          rightSlot={
            <BusinessSettingsDrawe
              initialBusiness={business}
              staffList={staffList}
              services={services}
            />
          }
        >
          <DashboardAlerts business={business} bookings={bookings} />
        </DashboardHeader>

        {/* STATS FIRST */}
        <StatsCards businessId={business._id.toString()} />

        {/* NEW PERFORMANCE GRAPH */}
        <PerformanceChart bookings={bookings} />

        {/* SCHEDULE + REVENUE */}
        <div className="grid md:grid-cols-2 gap-6">
          <TodaysSchedule bookings={bookings} business={business} />
          <RevenuePanel bookings={bookings} business={business} />
        </div>

        {/* BOOKING SECTION */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <BookingLinkCard username={business.username} />
            <UpcomingBookings
              initialBookings={bookings}
              business={business}
            />
          </div>
        </div>

      </div>
    </div>
  );
}