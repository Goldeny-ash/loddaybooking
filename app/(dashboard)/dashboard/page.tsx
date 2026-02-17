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
import NewBottomSidebar from "@/components/dashboard/NewBottomSidebar";

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
    <div className="min-h-screen bg-white">
      <div className="flex w-full">
        <Sidebar
          business={business}
          staffList={staffList}
          services={services}
          bookings={bookings}
          theme={theme}
        />

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-4 pb-24 sm:px-5 sm:py-5 lg:px-8 lg:py-6 lg:space-y-8">
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

          <StatsCards businessId={business._id.toString()} />

          <PerformanceChart bookings={bookings} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="todays-schedule">
            <TodaysSchedule bookings={bookings} business={business} />
            <RevenuePanel bookings={bookings} business={business} />
          </div>

          <div className="space-y-6" id="upcoming-bookings">
            <BookingLinkCard username={business.username} />
            <UpcomingBookings initialBookings={bookings} business={business} />
          </div>
        </div>
        </main>
        <NewBottomSidebar
          business={business}
          staffList={staffList}
          services={services}
          bookings={bookings}
        />
      </div>
    </div>
  );
}
