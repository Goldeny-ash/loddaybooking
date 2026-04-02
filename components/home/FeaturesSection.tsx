"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import FloatingShape from "@/components/FloatingShape";
import {
  BellRing,
  CalendarCheck2,
  CreditCard,
  GalleryVerticalEnd,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
} from "lucide-react";

const iconMap = {
  bell: BellRing,
  calendar: CalendarCheck2,
  creditCard: CreditCard,
  dashboard: LayoutDashboard,
  gallery: GalleryVerticalEnd,
  location: MapPinned,
  shield: ShieldCheck,
} as const;

export interface Feature {
  title: string;
  subtitle: string;
  benefits: string[];
  iconName?: keyof typeof iconMap;
  bgColor: string;
  textColor?: string;
  imageSrc?: string;
}

interface FeaturesSectionProps {
  features: Feature[];
  id?: string;
}

export default function FeaturesSection({ features, id }: FeaturesSectionProps) {
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [features.length]);

  const activeFeature = features[activeTab];
  const ActiveIcon = activeFeature.iconName ? iconMap[activeFeature.iconName] : undefined;

  return (
    <section id={id} className="relative overflow-x-hidden bg-[#FFF4E1] py-24">
      <FloatingShape size={80} x={10} y={10} color="#78290F" opacity={0.05} />
      <FloatingShape size={60} x={80} y={20} color="#15616D" opacity={0.06} />

      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-4 text-center font-serif text-4xl text-[#15616D]">
          Features that help you book more and chase clients less
        </h2>
       

        <div className="mb-6 flex gap-3 overflow-x-auto pb-2 md:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {features.map((feature, i) => (
            <button
              key={`${feature.title}-mobile-tab`}
              type="button"
              onClick={() => setActiveTab(i)}
              className="shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-transform hover:scale-105"
              style={{
                backgroundColor: activeTab === i ? feature.bgColor : "transparent",
                color: activeTab === i ? feature.textColor || "#FFF" : "#15616D",
                border: activeTab === i ? "none" : "1px solid #15616D",
              }}
            >
              {feature.title}
            </button>
          ))}
        </div>

        <div className="md:hidden">
          <motion.div
            key={`mobile-${activeTab}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-3xl p-6 shadow-2xl"
            style={{
              backgroundColor: activeFeature.bgColor,
              color: activeFeature.textColor || "#FFF",
            }}
          >
            {ActiveIcon && (
              <div
                className="mb-4 inline-flex rounded-full p-3"
                style={{
                  backgroundColor: activeFeature.textColor ? `${activeFeature.textColor}20` : "#FFFFFF20",
                }}
              >
                <ActiveIcon size={32} color={activeFeature.textColor || "#FFF"} />
              </div>
            )}
            <h3 className="mb-3 font-serif text-xl">{activeFeature.title}</h3>
            <p className="mb-4 text-sm">{activeFeature.subtitle}</p>
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <ul className="grid min-w-full grid-cols-1 gap-2 list-disc list-inside text-sm">
                {activeFeature.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {features.map((feature, i) => (
              <button
                key={`${feature.title}-mobile-dot`}
                type="button"
                onClick={() => setActiveTab(i)}
                aria-label={`Show ${feature.title}`}
                className={`h-2.5 rounded-full transition-all ${
                  activeTab === i ? "w-6 bg-[#15616D]" : "w-2.5 bg-[#15616D]/35"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="mb-12 flex flex-wrap justify-center gap-4">
            {features.map((feature, i) => (
              <button
                key={feature.title}
                onClick={() => setActiveTab(i)}
                className="rounded-full px-6 py-2 font-medium transition-transform hover:scale-105"
                style={{
                  backgroundColor: activeTab === i ? feature.bgColor : "transparent",
                  color: activeTab === i ? feature.textColor || "#FFF" : "#15616D",
                  border: activeTab === i ? "none" : "1px solid #15616D",
                }}
              >
                {feature.title}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 hover:-translate-y-2"
            style={{
              backgroundColor: activeFeature.bgColor,
              color: activeFeature.textColor || "#FFF",
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                zIndex: 0,
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to right, rgba(255,255,255,0.05), rgba(0,0,0,0.05))",
                zIndex: 1,
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-8 p-10 md:flex-row">
              {ActiveIcon && (
                <motion.div
                  className="flex flex-shrink-0 justify-center md:justify-start"
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 150 }}
                >
                  <div
                    className="rounded-full p-4"
                    style={{
                      backgroundColor: activeFeature.textColor ? `${activeFeature.textColor}20` : "#FFFFFF20",
                    }}
                  >
                    <ActiveIcon size={48} color={activeFeature.textColor || "#FFF"} />
                  </div>
                </motion.div>
              )}

              <div className="flex-1">
                <h3 className="mb-4 font-serif text-2xl">{activeFeature.title}</h3>
                <p className="mb-4 text-sm md:text-base">{activeFeature.subtitle}</p>
                <ul className="grid grid-cols-1 gap-2 list-disc list-inside text-sm sm:grid-cols-2">
                  {activeFeature.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>

              {activeFeature.imageSrc && (
                <motion.div
                  className="hidden flex-shrink-0 md:block"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src={activeFeature.imageSrc}
                    alt={activeFeature.title}
                    width={160}
                    height={160}
                    className="rounded-2xl object-cover shadow-lg"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
