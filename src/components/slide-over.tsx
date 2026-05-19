"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

const widthClasses = {
  sm: "w-96",
  md: "w-[32rem]",
  lg: "w-[48rem]",
  xl: "w-[64rem]",
};

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  width = "lg",
}: SlideOverProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`fixed right-0 top-0 z-50 h-full ${widthClasses[width]} flex flex-col border-l border-border bg-surface shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-muted">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 rounded-lg p-1.5 hover:bg-surface-elevated transition-colors duration-200 shrink-0"
                aria-label="Close panel"
              >
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
