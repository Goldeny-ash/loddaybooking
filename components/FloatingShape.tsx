"use client";
import { motion } from "framer-motion";

type Props = {
  size: number;
  x: number;
  y: number;
  color: string;
  opacity?: number;
  animate?: boolean;
};

export default function FloatingShape({ size, x, y, color, opacity = 0.1, animate = true }: Props) {
  return (
    <motion.div
      initial={{ y: 0, rotate: 0, scale: 1 }}
      animate={
        animate
          ? { y: [0, 12, 0], rotate: [0, 10, -10, 0], scale: [1, 1.03, 1, 1.03] }
          : {}
      }
      transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity,
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
