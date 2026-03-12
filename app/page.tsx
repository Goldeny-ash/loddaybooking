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
      subtitle: "Appear in Lodday’s booking marketplace instantly.",
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
      {/* Hero Section */}
      <CurvedSection
        bg="linear-gradient(120deg, #FFECD1 0%, #FFF4E1 100%)"
        style={{ paddingBottom: "96px", paddingLeft: "1rem", paddingRight: "1rem" }}
      >
        <>
          <Navbar />
          <FloatingShape size={120} x={10} y={5} color={colors.accent} opacity={0.08} />
          <FloatingShape size={80} x={75} y={20} color={colors.primary} opacity={0.05} />
          <FloatingShape size={60} x={50} y={70} color={colors.secondary} opacity={0.06} />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12 w-full max-w-[1600px] mx-auto">
            {/* Left Text */}
            <div className="w-full md:w-1/2 flex flex-col justify-center text-center md:text-left">
              <h1 className="font-serif text-4xl md:text-6xl leading-tight mb-6 text-[#001524]">
                Stop No-Shows. Fill Every Slot.
              </h1>
              <p className="text-lg md:text-xl max-w-lg mb-8 text-[#15616D] mx-auto md:mx-0">
                Enforce grace periods, mandatory check-ins, late rules, and walk-in fairness — automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/dashboard"
                  className="px-10 py-4 rounded-full drop-shadow-lg inline-block hover:scale-105 transition-transform"
                  style={{ backgroundColor: colors.accent, color: colors.lightPeach }}
                >
                  Start Free
                </Link>
                <Link
                  href="/dashboard"
                  className="px-10 py-4 rounded-full border border-[#15616D]/20 bg-white/70 text-[#15616D] shadow-sm transition-transform hover:scale-105"
                >
                  Dashboard
                </Link>
                <p className="mt-2 md:mt-0 text-sm opacity-70 text-[#15616D]">
                  No credit card required • Cancel anytime
                </p>
              </div>
            </div>

            {/* Right Video */}
            <motion.div
              className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <video
                src="/animations/checkin-demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="rounded-[32px] shadow-2xl w-full max-w-[560px] object-cover"
              />
            </motion.div>
          </div>
        </>
      </CurvedSection>

      {/* Business Types */}
      <CurvedSection bg={colors.softPeach}>
        <>
          <h2 className="font-serif text-4xl text-center mb-14 text-[#001524]">
            Perfect for Service Businesses
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto px-6">
            {businessTypes.map((type) => (
              <motion.div
                key={type}
                whileHover={{ y: -6 }}
                className="rounded-3xl p-6 text-center shadow-xl hover:shadow-2xl transition-all"
                style={{ backgroundColor: colors.secondary, color: colors.lightPeach }}
              >
                <h3 className="font-serif text-lg">{type}</h3>
              </motion.div>
            ))}
          </div>
        </>
      </CurvedSection>

      {/* Features Section */}
      <FeaturesSection features={features} id="features" />

      <ReviewsSection scope="platform" />

      {/* Pricing */}
      <div id="pricing">
        <CurvedSection bg={colors.primary} centerContent>
          <h2 className="font-serif text-4xl mb-4 text-lightPeach">Pricing</h2>
          <p className="text-lightPeach mb-8">Simple flat monthly pricing. Includes email reminders.</p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            {/* Free Trial */}
            <motion.div
              className="rounded-3xl p-8 shadow-2xl bg-secondary hover:-translate-y-1 transition transform w-64"
              style={{ color: colors.white }}
              whileHover={{ y: -4 }}
            >
              <h3 className="text-3xl font-serif mb-4">Free Trial</h3>
              <p className="mb-6">Test all features without credit card.</p>
              <Link
                href="/setup?mode=trial"
                onClick={() => localStorage.setItem("onboardingMode", "trial")}
                className="px-6 py-3 rounded-full drop-shadow-md inline-block w-full text-center hover:scale-105 transition-transform"
                style={{ backgroundColor: colors.accent, color: colors.white }}
              >
                Start Free Trial
              </Link>
            </motion.div>

            {/* Imm ediate Subscription */}
            <motion.div
              className="rounded-3xl p-8 shadow-2xl bg-secondary hover:-translate-y-1 transition transform w-64"
              style={{ color: colors.white }}
              whileHover={{ y: -4 }}
            >
              <h3 className="text-3xl font-serif mb-4">Go Live Now</h3>
              <p className="mb-6">600 KSh / month</p>
              <Link
                href="/setup?mode=subscribe"
                onClick={() => localStorage.setItem("onboardingMode", "subscribe")}
                className="px-6 py-3 rounded-full drop-shadow-md inline-block w-full text-center hover:scale-105 transition-transform"
                style={{ backgroundColor: colors.lightPeach, color: colors.primary }}
              >
                Go Live Now – KSh 600
              </Link>
            </motion.div>
          </div>
          <p className="mt-4 text-sm opacity-70 text-lightPeach">Appear in customer marketplace immediately.</p>
        </CurvedSection>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default HomePage;
