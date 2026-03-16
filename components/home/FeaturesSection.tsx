"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FloatingShape from "@/components/FloatingShape";
import Image from "next/image";

export interface Feature {
  title: string;
  subtitle: string;
  benefits: string[];
  Icon?: React.FC<{ size?: number; color?: string }>;
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

  return (
    <section id={id} className="relative py-24 overflow-x-hidden bg-[#FFF4E1]">
      <FloatingShape size={80} x={10} y={10} color="#78290F" opacity={0.05} />
      <FloatingShape size={60} x={80} y={20} color="#15616D" opacity={0.06} />

      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-serif text-4xl text-center mb-12 text-[#15616D]">
          Built for Real Businesses
        </h2>

        {/* Mobile Feature View */}
        <div className="md:hidden">
          <motion.div
            key={`mobile-${activeTab}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl shadow-2xl p-6"
            style={{
              backgroundColor: activeFeature.bgColor,
              color: activeFeature.textColor || "#FFF",
            }}
          >
            {activeFeature.Icon && (
              <div
                className="inline-flex p-3 rounded-full mb-4"
                style={{
                  backgroundColor: activeFeature.textColor
                    ? `${activeFeature.textColor}20`
                    : "#FFFFFF20",
                }}
              >
                <activeFeature.Icon
                  size={32}
                  color={activeFeature.textColor || "#FFF"}
                />
              </div>
            )}
            <h3 className="font-serif text-xl mb-3">{activeFeature.title}</h3>
            <p className="mb-4 text-sm">{activeFeature.subtitle}</p>
            <ul className="grid grid-cols-1 gap-2 list-disc list-inside text-sm">
              {activeFeature.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
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

        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            {features.map((f, i) => (
              <button
                key={f.title}
                onClick={() => setActiveTab(i)}
                className="px-6 py-2 rounded-full font-medium transition-transform hover:scale-105"
                style={{
                  backgroundColor: activeTab === i ? f.bgColor : "transparent",
                  color: activeTab === i ? f.textColor || "#FFF" : "#15616D",
                  border: activeTab === i ? "none" : "1px solid #15616D",
                }}
              >
                {f.title}
              </button>
            ))}
          </div>

          {/* Active Feature Card */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl shadow-2xl mx-auto max-w-5xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300"
            style={{
              backgroundColor: activeFeature.bgColor,
              color: activeFeature.textColor || "#FFF",
            }}
          >
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                zIndex: 0,
              }}
            />

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.05), rgba(0,0,0,0.05))`,
                zIndex: 1,
              }}
            />

            {/* Content */}
            <div className="flex flex-col md:flex-row items-center gap-8 p-10 relative z-10">
              {/* Icon */}
              {activeFeature.Icon && (
                <motion.div
                  className="flex-shrink-0 flex justify-center md:justify-start"
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 150 }}
                >
                  <div
                    className="p-4 rounded-full"
                    style={{
                      backgroundColor: activeFeature.textColor
                        ? `${activeFeature.textColor}20`
                        : "#FFFFFF20",
                    }}
                  >
                    <activeFeature.Icon
                      size={48}
                      color={activeFeature.textColor || "#FFF"}
                    />
                  </div>
                </motion.div>
              )}

              {/* Text */}
              <div className="flex-1">
                <h3 className="font-serif text-2xl mb-4">{activeFeature.title}</h3>
                <p className="mb-4 text-sm md:text-base">{activeFeature.subtitle}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-disc list-inside text-sm">
                  {activeFeature.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>

              {/* Optional Image */}
              {activeFeature.imageSrc && (
                <motion.div
                  className="hidden md:block flex-shrink-0"
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
