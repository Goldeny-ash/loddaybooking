"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import CurvedSection from "@/components/home/CurvedSection";
import FloatingShape from "@/components/FloatingShape";
import FeaturesSection from "@/components/home/FeaturesSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import Footer from "@/components/Footer";
import { Zap, Users, BarChart2, MessageSquare, CheckSquare, Calendar, CreditCard } from "lucide-react";

type Feature = {
  title: string;
  subtitle: string;
  benefits: string[];
  Icon: React.FC<{ size?: number; color?: string }>;
  bgColor: string;
  textColor?: string;
};

const HomePage = () => {
  const colors = {
    primary: "#15616D",
    secondary: "#78290F",
    accent: "#FE7F2D",
    lightPeach: "#FFECD1",
    softPeach: "#FFF4E1",
    seamountLight: "#C2E0E0",
    darkText: "#1A1A1A",
    white: "#FFFFFF",
  };

  const features: Feature[] = [
    {
      title: "Marketplace Discovery",
      subtitle: "Appear in Lodday's booking marketplace instantly.",
      benefits: ["New clients without ads", "Local visibility", "Public profile page", "Ratings & photos", "Direct booking links"],
      Icon: Zap,
      bgColor: colors.primary,
      textColor: colors.white,
    },
    {
      title: "Customer Retention",
      subtitle: "Turn walk-ins into repeat clients with personalized booking links.",
      benefits: ["Personal booking URL", "QR code at reception", "SMS/WhatsApp follow-ups", "Auto reminders", "Loyalty memory"],
      Icon: Users,
      bgColor: colors.secondary,
      textColor: colors.white,
    },
    {
      title: "Fairness Engine",
      subtitle: "Automatically enforce grace periods and release late bookings.",
      benefits: ["Configurable grace timer", "Mandatory check-in", "Auto-release", "Walk-in queue", "SMS reminders", "Late-arrival rules"],
      Icon: CheckSquare,
      bgColor: colors.seamountLight,
      textColor: colors.darkText,
    },
    {
      title: "Style Gallery",
      subtitle: "Remember every style your clients love.",
      benefits: ["Client style gallery", "Upload photos per visit", "Attach to booking", "Reference previous looks", "Faster service", "Personal experience"],
      Icon: Calendar,
      bgColor: colors.lightPeach,
      textColor: colors.darkText,
    },
    {
      title: "Approval-Based Bookings",
      subtitle: "Accept or decline bookings with confidence.",
      benefits: ["Manual approval mode", "Decline reason messages", "Auto-reschedule suggestions", "Staff availability checks", "Capacity rules"],
      Icon: BarChart2,
      bgColor: colors.accent,
      textColor: colors.white,
    },
    {
      title: "Booking Fees",
      subtitle: "Protect your time with optional booking deposits.",
      benefits: ["Optional booking deposit", "Customer pre-payment", "Escrow-style holding", "Auto release after approval", "Refund rules", "Reduces no-shows"],
      Icon: CreditCard,
      bgColor: colors.secondary,
      textColor: colors.white,
    },
    {
      title: "Business Analytics",
      subtitle: "See what makes you money.",
      benefits: ["Popular services", "No-show rate", "Peak hours", "Returning customers", "Revenue trends"],
      Icon: BarChart2,
      bgColor: colors.primary,
      textColor: colors.white,
    },
    {
      title: "Automated Messaging",
      subtitle: "Customers show up because you remind them.",
      benefits: ["WhatsApp", "SMS", "Email", "Custom templates", "Check-in links"],
      Icon: MessageSquare,
      bgColor: colors.seamountLight,
      textColor: colors.darkText,
    },
  ];

  const businessTypes = ["Salons & Barbershops", "Spas & Beauty Clinics", "Nail Studios", "Physios / Dentists", "Auto Detailers"];

  return (
    <main className="relative pt-28">
      <CurvedSection
        bg="linear-gradient(120deg, #FFECD1 0%, #FFF4E1 100%)"
        style={{ paddingBottom: "96px", paddingLeft: "1rem", paddingRight: "1rem" }}
      >
        <>
          <Navbar />
          <FloatingShape size={120} x={10} y={5} color={colors.accent} opacity={0.08} />
          <FloatingShape size={80} x={75} y={20} color={colors.primary} opacity={0.05} />
          <FloatingShape size={60} x={50} y={70} color={colors.secondary} opacity={0.06} />

          <div className="flex w-full max-w-[1600px] mx-auto flex-col gap-12 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col justify-center text-center md:w-1/2 md:text-left">
              <h1 className="mb-6 font-serif text-4xl leading-tight text-[#001524] md:text-6xl">
                Stop No-Shows. Fill Every Slot.
              </h1>
              <p className="mx-auto mb-6 max-w-lg text-lg text-[#15616D] md:mx-0 md:text-xl">
                Enforce grace periods, mandatory check-ins, late rules, and walk-in fairness automatically.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row md:justify-start">
                <Link
                  href="/dashboard"
                  className="inline-block rounded-full px-10 py-4 drop-shadow-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: colors.accent, color: colors.lightPeach }}
                >
                  Start Free
                </Link>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-[#15616D]/20 bg-white/70 px-10 py-4 text-center text-[#15616D] shadow-sm transition-transform hover:scale-105"
                  >
                    View Dashboard
                  </Link>
                  <Link
                    href="/help"
                    className="rounded-full border border-[#FE7F2D]/20 bg-[#FFF4E1] px-10 py-4 text-center text-[#78290F] shadow-sm transition-transform hover:scale-105"
                  >
                    Help / Tutorials
                  </Link>
                </div>
                <p className="mt-2 text-sm text-[#15616D] opacity-70 md:mt-0">
                  No credit card required • Cancel anytime
                </p>
              </div>
            </div>

            <motion.div
              className="mt-8 flex w-full justify-center md:mt-0 md:w-1/2"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <video
                src="/animations/checkin-demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full max-w-[560px] rounded-[32px] object-cover shadow-2xl"
              />
            </motion.div>
          </div>
        </>
      </CurvedSection>

      <CurvedSection bg={colors.softPeach}>
        <>
          <h2 className="mb-14 text-center font-serif text-4xl text-[#001524]">
            Perfect for Service Businesses
          </h2>
          <div className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {businessTypes.map((type) => (
              <motion.div
                key={type}
                whileHover={{ y: -6 }}
                className="rounded-3xl p-6 text-center shadow-xl transition-all hover:shadow-2xl"
                style={{ backgroundColor: colors.secondary, color: colors.lightPeach }}
              >
                <h3 className="font-serif text-lg">{type}</h3>
              </motion.div>
            ))}
          </div>
        </>
      </CurvedSection>

      <FeaturesSection features={features} id="features" />

      <ReviewsSection scope="platform" />

      <div id="pricing">
        <CurvedSection bg={colors.primary} centerContent>
          <h2 className="mb-4 font-serif text-4xl text-lightPeach">Pricing</h2>
          <p className="mb-8 text-lightPeach">Simple flat monthly pricing. Includes email reminders.</p>
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
            <motion.div
              className="w-64 rounded-3xl bg-secondary p-8 shadow-2xl transition transform hover:-translate-y-1"
              style={{ color: colors.white }}
              whileHover={{ y: -4 }}
            >
              <h3 className="mb-4 text-3xl font-serif">Free Trial</h3>
              <p className="mb-6">Test all features without credit card.</p>
              <Link
                href="/setup?mode=trial"
                onClick={() => localStorage.setItem("onboardingMode", "trial")}
                className="inline-block w-full rounded-full px-6 py-3 text-center drop-shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: colors.accent, color: colors.white }}
              >
                Start Free Trial
              </Link>
            </motion.div>

            <motion.div
              className="w-64 rounded-3xl bg-secondary p-8 shadow-2xl transition transform hover:-translate-y-1"
              style={{ color: colors.white }}
              whileHover={{ y: -4 }}
            >
              <h3 className="mb-4 text-3xl font-serif">Go Live Now</h3>
              <p className="mb-6">600 KSh / month</p>
              <Link
                href="/setup?mode=subscribe"
                onClick={() => localStorage.setItem("onboardingMode", "subscribe")}
                className="inline-block w-full rounded-full px-6 py-3 text-center drop-shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: colors.lightPeach, color: colors.primary }}
              >
                Go Live Now - KSh 600
              </Link>
            </motion.div>
          </div>
          <p className="mt-4 text-sm text-lightPeach opacity-70">
            Appear in customer marketplace immediately.
          </p>
        </CurvedSection>
      </div>

      <Footer />
    </main>
  );
};

export default HomePage;
