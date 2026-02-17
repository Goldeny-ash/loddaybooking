"use client";

import { motion } from "framer-motion";
import { ReactNode, CSSProperties } from "react";

interface CurvedSectionProps {
  children: ReactNode;
  bg?: string;
  centerContent?: boolean;
  style?: CSSProperties; // <-- add style prop
}

export default function CurvedSection({
  children,
  bg = "#FFF6EC",
  centerContent = false,
  style,
}: CurvedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{ background: bg, ...style }} // <-- merge style here
      className="
        relative
        -mt-[72px]
        rounded-t-[80px]
        sm:rounded-t-[120px]
        lg:rounded-t-[160px]
        shadow-[0_-8px_40px_rgba(0,0,0,0.05)]
        py-32
      "
    >
      <div
        className={`max-w-7xl mx-auto px-6 ${
          centerContent
            ? "flex flex-col items-center gap-12 text-center"
            : "flex flex-col gap-12"
        }`}
      >
        {children}
      </div>
    </motion.section>
  );
}
