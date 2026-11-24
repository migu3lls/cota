"use client";

import React from "react";

export function CotaMark({
  size = 28,
  variant = "adaptive",
  className = "",
}: {
  size?: number;
  variant?: "adaptive" | "dark" | "light";
  className?: string;
}) {
  const dotClass =
    variant === "dark"
      ? "fill-[#F5FFFA]"
      : variant === "light"
      ? "fill-[#0D0D0D]"
      : "fill-[#0D0D0D] dark:fill-[#F5FFFA]";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="cotaInlineGrad" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#18E299" />
          <stop offset="100%" stopColor="#0FA76E" />
        </linearGradient>
      </defs>
      <path
        d="M 73.15 75.71 A 34.6 34.6 0 0 1 18.90 34.83"
        stroke="url(#cotaInlineGrad)"
        strokeWidth="18.8"
        strokeLinecap="round"
      />
      <path
        d="M 40.46 16.74 A 34.6 34.6 0 0 1 73.15 24.29"
        stroke="#18E299"
        strokeWidth="18.8"
        strokeLinecap="round"
      />
      <circle cx="84.6" cy="50" r="10.15" className={dotClass} />
    </svg>
  );
}

export function CotaLogo({
  size = "md",
  showSubtag = true,
}: {
  size?: "sm" | "md" | "lg";
  showSubtag?: boolean;
}) {
  const markSize = size === "sm" ? 24 : size === "lg" ? 36 : 30;
  const titleClass =
    size === "sm"
      ? "text-base"
      : size === "lg"
      ? "text-2xl"
      : "text-[19px]";

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <CotaMark size={markSize} variant="adaptive" />
      <div className="leading-none">
        <span
          className={`${titleClass} font-bold tracking-[-0.04em] text-[var(--text-primary)] block`}
        >
          Cota
        </span>
        {showSubtag && (
          <span className="font-mono-tech text-[9px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] block mt-0.5">
            BY 10ATIVAS
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Miniatura fiel de como o icone do PWA aparece na Tela de Inicio do iPhone
 * (com mascara squircle do iOS e margem anti-zoom de 28%).
 */
export function CotaPwaIconPreview({ size = 60 }: { size?: number }) {
  return (
    <div className="inline-flex flex-col items-center gap-1.5 select-none">
      <div
        style={{ width: size, height: size }}
        className="rounded-[22.5%] overflow-hidden shadow-md ring-1 ring-black/10 dark:ring-white/15 bg-[#0D0D0D] shrink-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/apple-touch-icon.png"
          alt="Ícone do app Cota na Tela de Início"
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-[11px] font-medium tracking-tight text-[var(--text-primary)]">
        Cota
      </span>
    </div>
  );
}
