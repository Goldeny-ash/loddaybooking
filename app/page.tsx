"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import CurvedSection from "@/components/home/CurvedSection";
import FloatingShape from "@/components/FloatingShape";
import FeaturesSection from "@/components/home/FeaturesSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import Footer from "@/components/Footer";

type Feature = {
  title: string;
  subtitle: string;
  benefits: string[];
  iconName:
    | "bell"
    | "creditCard"
    | "dashboard"
    | "gallery"
    | "location"
    | "shield";
  bgColor: string;
  textColor?: string;
};

const whatsappHref =
  "https://wa.me/254723711925?text=Hi%20Lodday%2C%20I%20need%20help%20setting%20up%20my%20booking%20page.";

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
      title: "Personal Booking Link",
      subtitle:
        "Share one link everywhere so clients can book you from Instagram, WhatsApp, TikTok, Facebook, or your status.",
      benefits: [
        "One personal booking page",
        "Easy to share in bios and chats",
        "Clients book without back-and-forth texts",
        "Works for new and repeat clients",
        "Creates a polished first impression",
      ],
      iconName: "dashboard",
      bgColor: colors.primary,
      textColor: colors.white,
    },
    {
      title: "Deposits & Booking Fees",
      subtitle:
        "Protect your time with deposits before clients confirm, especially for premium or high-demand appointments.",
      benefits: [
        "Collect deposits before confirmation",
        "Reduce no-shows and late cancellations",
        "Ideal for nail techs and makeup artists",
        "Great for photographers and mobile pros",
        "Makes serious clients commit faster",
      ],
      iconName: "creditCard",
      bgColor: colors.secondary,
      textColor: colors.white,
    },
    {
      title: "Mobile Callout Fees",
      subtitle:
        "Automatically charge callout fees based on client location or distance for home, office, or on-site bookings.",
      benefits: [
        "Set mobile pricing clearly",
        "Charge more for farther locations",
        "Perfect for home hairstylists",
        "Useful for massage therapists and photographers",
        "Protects your transport time and costs",
      ],
      iconName: "location",
      bgColor: colors.seamountLight,
      textColor: colors.darkText,
    },
    {
      title: "Automated Reminders",
      subtitle:
        "Reduce missed appointments with automatic reminders that keep clients informed before the booking starts.",
      benefits: [
        "Automatic appointment reminders",
        "Cuts forgotten bookings",
        "Keeps clients updated",
        "Saves manual follow-up time",
        "Creates peace of mind every day",
      ],
      iconName: "bell",
      bgColor: colors.lightPeach,
      textColor: colors.darkText,
    },
    {
      title: "Client History & Previous Styles",
      subtitle:
        "Save previous hairstyles, nail designs, colors, preferences, and notes so each visit feels personal.",
      benefits: [
        "Track styles and preferences",
        "Remember past looks faster",
        "Perfect for salons and braiders",
        "Useful for nail artists and beauty studios",
        "Makes repeat visits feel seamless",
      ],
      iconName: "gallery",
      bgColor: colors.accent,
      textColor: colors.white,
    },
    {
      title: "Approval Mode",
      subtitle:
        "Approve premium bookings manually before clients pay when you need extra control over custom or high-value sessions.",
      benefits: [
        "Great for photographers",
        "Useful for tattoo artists and consultants",
        "Helps music teachers review requests",
        "Adds control for premium sessions",
        "Keeps your calendar protected",
      ],
      iconName: "shield",
      bgColor: colors.primary,
      textColor: colors.white,
    },
  ];

  const businessTypes = [
    "Salons & Barbers",
    "Nail Technicians",
    "Makeup Artists",
    "Lash & Brow Artists",
    "Braiders & Hairstylists",
    "Tattoo Artists",
    "Massage Therapists",
    "Photographers",
    "Music Teachers",
    "Tutors & Coaches",
    "Therapists & Consultants",
    "Mobile Service Professionals",
  ];

  const steps = [
    {
      step: "1",
      title: "Set your services",
      text: "Hair, nails, shoots, lessons, consultations, and every other one-on-one session you offer.",
    },
    {
      step: "2",
      title: "Share your booking link",
      text: "Post it on Instagram, WhatsApp, TikTok, Facebook, or send it directly to clients.",
    },
    {
      step: "3",
      title: "Get booked automatically",
      text: "Clients pick a slot, pay a deposit, and receive reminders without all the texting back and forth.",
    },
  ];

  const growthLinks = [
    {
      eyebrow: "Customer Discovery",
      title: "Explore the Lodday marketplace",
      description:
        "Browse active businesses, see how booking pages look live, and discover how customers find service providers on Lodday.",
      href: "/marketplace",
      cta: "Visit Marketplace",
      bgColor: colors.white,
      textColor: colors.darkText,
      borderColor: "border-[#15616D]/10",
    },
    {
      eyebrow: "Extra Revenue",
      title: "Join the affiliate program",
      description:
        "Refer businesses to Lodday, earn commission on successful subscriptions, and track your progress from the affiliate dashboard.",
      href: "/affiliates",
      cta: "Become an Affiliate",
      bgColor: colors.secondary,
      textColor: colors.white,
      borderColor: "border-[#78290F]/20",
    },
  ];

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

          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-12 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col justify-center text-center md:w-1/2 md:text-left">
              <h1 className="mb-6 font-serif text-4xl leading-tight text-[#001524] md:text-6xl">
                Get More Clients and Stay Fully Booked
              </h1>
              <p className="mx-auto mb-6 max-w-xl text-lg text-[#15616D] md:mx-0 md:text-xl">
                Give clients your personal booking link, collect deposits, manage mobile callout fees, and let them
                book you 24/7.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row md:justify-start">
                <Link
                  href="/setup?mode=trial"
                  onClick={() => localStorage.setItem("onboardingMode", "trial")}
                  className="inline-block rounded-full px-6 py-4 text-center drop-shadow-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: colors.accent, color: colors.lightPeach }}
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-[#15616D]/20 bg-white/70 px-6 py-4 text-center text-[#15616D] shadow-sm transition-transform hover:scale-105"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/help"
                  className="rounded-full border align-center border-[#FE7F2D]/20 bg-[#FFF4E1] px-6 py-4 text-center text-[#78290F] shadow-sm transition-transform hover:scale-105"
                >
                  Watch Demo
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:flex md:flex-wrap md:justify-start">
                <Link
                  href="/marketplace"
                  className="rounded-full border border-[#15616D]/20 bg-white/70 px-6 py-3 text-sm font-medium text-[#15616D] shadow-sm transition-transform hover:scale-105"
                >
                  Explore Marketplace
                </Link>
                <Link
                  href="/affiliates"
                  className="rounded-full border border-[#78290F]/20 bg-[#FFF4E1] px-6 py-3 text-sm font-medium text-[#78290F] shadow-sm transition-transform hover:scale-105"
                >
                  Earn as an Affiliate
                </Link>
              </div>

              
            </div>

            <motion.div
              className="mt-8 flex w-full justify-center md:mt-0 md:w-1/2"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-full max-w-[360px] overflow-hidden rounded-[32px] shadow-2xl sm:max-w-[420px] md:max-w-[460px]">
                <video
                  src="/checkin-demo.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-[300px] w-full object-cover object-center sm:h-[580px] md:h-[620px]"
                />
              </div>
            </motion.div>
          </div>
        </>
      </CurvedSection>

   

      <CurvedSection bg={colors.softPeach}>
        <>
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="mb-4 font-serif text-4xl text-[#001524]">How Lodday works</h2>
            <p className="mx-auto mb-12 max-w-3xl text-lg text-[#15616D]">
              Lodday helps any appointment-based business get booked professionally with one simple link.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((item) => (
                <motion.div
                  key={item.step}
                  whileHover={{ y: -6 }}
                  className="rounded-[28px] bg-white/80 p-8 text-left shadow-xl"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#15616D] text-lg font-semibold text-white">
                    {item.step}
                  </div>
                  <h3 className="mb-3 font-serif text-2xl text-[#001524]">{item.title}</h3>
                  <p className="text-[#15616D]">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      </CurvedSection>

      <CurvedSection bg={colors.softPeach}>
        <>
          <h2 className="text-center font-serif text-4xl text-[#001524]">
            Perfect for professionals who sell their time
          </h2>
         
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 md:grid-cols-3 lg:grid-cols-4">
            {businessTypes.map((type) => (
              <motion.div
                key={type}
                whileHover={{ y: -6 }}
                className="rounded-3xl p-5 text-center shadow-xl transition-all hover:shadow-2xl md:p-6"
                style={{ backgroundColor: colors.secondary, color: colors.lightPeach }}
              >
                <h3 className="font-serif text-base md:text-lg">{type}</h3>
              </motion.div>
            ))}
          </div>
        </>
      </CurvedSection>

      <FeaturesSection features={features} id="features" />

      <ReviewsSection scope="platform" />

      <div id="pricing">
        <CurvedSection bg={colors.primary} centerContent>
          <p className="mb-3 max-w-4xl text-center text-sm uppercase tracking-[0.2em] text-lightPeach/80">
            Trusted by salons, barbers, nail techs, photographers, tutors and mobile beauty professionals across Kenya.
          </p>
          <h2 className="mb-4 font-serif text-4xl text-lightPeach">Pricing</h2>
          <p className="mb-2 text-center text-2xl font-semibold text-lightPeach">One client can pay your whole month</p>
          <p className="mb-8 text-center text-lightPeach">
            Just KSh 600/month, usually recovered from one deposit booking.
          </p>
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
            <motion.div
              className="w-64 rounded-3xl bg-secondary p-8 shadow-2xl transition transform hover:-translate-y-1"
              style={{ color: colors.white }}
              whileHover={{ y: -4 }}
            >
              <h3 className="mb-4 text-3xl font-serif">Free Trial</h3>
              <p className="mb-6">Test all features.</p>
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
              <p className="mb-2 text-2xl font-semibold">KSh 600 / month</p>
              <p className="mb-6 text-sm text-white/80">Usually recovered from one deposit booking.</p>
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
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-sm text-lightPeach opacity-70">Appear in customer marketplace immediately.</p>
            <Link
              href={whatsappHref}
              className="rounded-full border border-[#FFF4E1]/30 bg-white/10 px-8 py-3 text-center text-lightPeach transition-transform hover:scale-105"
            >
              Need help setting up? Chat with us on WhatsApp
            </Link>
          </div>
        </CurvedSection>
      </div>

      <Footer />
    </main>
  );
};

export default HomePage;
