"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

interface Props {
  message: string | null;
  onClose: () => void;
  duration?: number;
  variant?: "success" | "error";
}

export default function ThemedPopup({
  message,
  onClose,
  duration = 2500,
  variant = "success",
}: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -30 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 flex items-center justify-center z-[100]"
        >
          <div
            className="px-10 py-6 rounded-3xl shadow-2xl text-lg text-center"
            style={{
              background:
                variant === "error"
                  ? "var(--brand-accent-dark)"
                  : "var(--brand-primary)",
              color: "white",
            }}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
