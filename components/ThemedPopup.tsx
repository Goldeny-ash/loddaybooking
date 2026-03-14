"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  message: string | null;
  onClose: () => void;
  duration?: number;
  variant?: "success" | "error";
  mode?: "toast" | "confirm";
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
}

export default function ThemedPopup({
  message,
  onClose,
  duration = 2500,
  variant = "success",
  mode = "toast",
  title,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!message || mode !== "toast") return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, mode, onClose]);

  useEffect(() => {
    if (!message || typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [message]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -30 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6"
        >
          <div
            className="my-auto w-full max-w-md rounded-3xl px-5 py-5 text-center shadow-2xl sm:px-8 sm:py-6"
            style={{
              background:
                mode === "confirm"
                  ? "#ffffff"
                  : variant === "error"
                    ? "var(--brand-accent-dark)"
                    : "var(--brand-primary)",
              color: mode === "confirm" ? "#000000" : "#ffffff",
            }}
          >
            {title ? <h3 className="mb-2 text-xl font-semibold">{title}</h3> : null}
            <p className="text-base">{message}</p>
            {mode === "confirm" ? (
              <div className="mt-5 flex justify-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="border border-black/20 text-black hover:bg-black/5"
                >
                  {cancelText}
                </Button>
                <Button
                  type="button"
                  onClick={onConfirm}
                  className="bg-white text-black hover:bg-white/90"
                >
                  {confirmText}
                </Button>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
