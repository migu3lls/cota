"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AppWindow,
  Cloud,
  GameController,
  MusicNotes,
  SquaresFour,
  Television,
  X,
} from "@phosphor-icons/react";
import type { ChargeUrgency, ServiceCategory } from "@/types/cobrar";

export function CategoryIcon({
  category,
  size = 20,
  className = "",
}: {
  category: ServiceCategory;
  size?: number;
  className?: string;
}) {
  const props = { size, weight: "duotone" as const, className };
  switch (category) {
    case "streaming":
      return <Television {...props} />;
    case "musica":
      return <MusicNotes {...props} />;
    case "nuvem":
      return <Cloud {...props} />;
    case "produtividade":
      return <AppWindow {...props} />;
    case "jogos":
      return <GameController {...props} />;
    default:
      return <SquaresFour {...props} />;
  }
}

const MONOGRAM_PALETTES = [
  "bg-[#0D0D0D] text-[#18E299] border border-[#18E299]/25",
  "bg-[#E8FFF5] text-[#0A4D32] border border-[#0FA76E]/20 dark:bg-[#18E299]/15 dark:text-[#18E299]",
  "bg-zinc-900 text-zinc-100 border border-zinc-700/40 dark:bg-zinc-800 dark:text-zinc-100",
  "bg-stone-200/80 text-stone-900 border border-stone-300/60 dark:bg-stone-800 dark:text-stone-200",
  "bg-slate-200/80 text-slate-900 border border-slate-300/60 dark:bg-slate-800 dark:text-slate-200",
];

export function MemberMonogram({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (name.slice(0, 2) || "FM").toUpperCase();

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const palette = MONOGRAM_PALETTES[hash % MONOGRAM_PALETTES.length];

  const dims =
    size === "sm"
      ? "w-8 h-8 text-[11px]"
      : size === "lg"
      ? "w-12 h-12 text-sm"
      : "w-10 h-10 text-xs";

  return (
    <div
      aria-hidden="true"
      className={`${dims} ${palette} font-mono-tech font-semibold rounded-full inline-flex items-center justify-center shrink-0 select-none tracking-tight`}
    >
      {initials}
    </div>
  );
}

export function UrgencyBadge({
  urgency,
  label,
}: {
  urgency: ChargeUrgency;
  label: string;
}) {
  const styles: Record<ChargeUrgency, { wrap: string; dot: string }> = {
    overdue: {
      wrap: "bg-[var(--status-error-bg)] text-[var(--status-error)] border-[var(--status-error)]/20",
      dot: "bg-[var(--status-error)]",
    },
    today: {
      wrap: "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/25",
      dot: "bg-[var(--status-warning)] animate-pulse",
    },
    soon: {
      wrap: "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/20",
      dot: "bg-[var(--status-warning)]",
    },
    upcoming: {
      wrap: "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
      dot: "bg-[var(--text-tertiary)]",
    },
    paid: {
      wrap: "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success)]/20",
      dot: "bg-[#18E299]",
    },
    exempt: {
      wrap: "bg-[var(--surface-muted)] text-[var(--text-tertiary)] border-[var(--border-subtle)]",
      dot: "bg-[var(--text-tertiary)]/50",
    },
  };

  const st = styles[urgency];

  return (
    <span
      className={`font-mono-tech inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-[0.04em] uppercase border ${st.wrap}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
      {label}
    </span>
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="relative z-10 w-full max-w-[520px] max-h-[90dvh] flex flex-col bg-[var(--surface-card)] border-t sm:border border-[var(--border-subtle)] rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden"
          >
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <span className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
            </div>

            <div className="flex items-start justify-between gap-4 px-5 pt-3 pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar janela"
                className="w-9 h-9 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div
              className="overflow-y-auto px-5 py-5 space-y-5"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export interface ToastData {
  id: string;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
}

export function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastData | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom))" }}
          className="fixed left-4 right-4 z-40 max-w-[488px] mx-auto pointer-events-auto"
        >
          <div className="bg-[#0D0D0D] text-white border border-white/12 rounded-full px-4 py-3 shadow-xl flex items-center justify-between gap-3">
            <span className="text-xs sm:text-sm font-medium truncate">
              {toast.message}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {toast.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onUndo?.();
                    onDismiss();
                  }}
                  className="font-mono-tech text-xs font-semibold uppercase tracking-wider text-[#18E299] hover:underline px-2 py-1 cursor-pointer"
                >
                  {toast.undoLabel || "Desfazer"}
                </button>
              )}
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Fechar aviso"
                className="text-white/60 hover:text-white p-1 cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
