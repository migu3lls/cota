"use client";

import React from "react";
import {
  CheckCircle,
  DotsThreeVertical,
  DownloadSimple,
  Export,
  PlusSquare,
} from "@phosphor-icons/react";
import { BottomSheet } from "@/components/ui/Primitives";
import { CotaPwaIconPreview } from "@/components/ui/CotaLogo";

interface PwaInstallSheetProps {
  open: boolean;
  onClose: () => void;
  isStandalone: boolean;
  canDirectInstall: boolean;
  onTriggerDirectInstall: () => Promise<void>;
}

export function PwaInstallSheet({
  open,
  onClose,
  isStandalone,
  canDirectInstall,
  onTriggerDirectInstall,
}: PwaInstallSheetProps) {
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent || "");

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Baixar o Cota no aparelho"
      subtitle="Fica na sua tela inicial em tela cheia e salva tudo localmente"
    >
      <div className="space-y-5">
        {/* Preview real do icone na tela inicial */}
        <div className="rounded-[20px] bg-[var(--surface-muted)]/75 border border-[var(--border-subtle)] p-4 flex items-center gap-4">
          <CotaPwaIconPreview size={64} />
          <div className="space-y-1 min-w-0">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--brand-deep)] block">
              ÍCONE CALIBRADO PARA IOS & ANDROID
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
              Proporção anti-zoom para iPhone
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Ícone opaco com área de respiro de 28% para o iOS aplicar o recorte sem cortar nem dar zoom excessivo na logo.
            </p>
          </div>
        </div>

        {isStandalone ? (
          <div className="rounded-2xl bg-[var(--status-success-bg)] border border-[var(--status-success)]/20 p-4 flex items-center gap-3 text-[var(--status-success)]">
            <CheckCircle size={22} weight="fill" className="shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              O <strong>Cota</strong> já está instalado e rodando em tela cheia direto no seu aparelho.
            </p>
          </div>
        ) : canDirectInstall ? (
          <button
            type="button"
            onClick={async () => {
              await onTriggerDirectInstall();
              onClose();
            }}
            className="w-full h-12 rounded-full bg-[#18E299] hover:bg-[#0FA76E] text-[#0D0D0D] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <DownloadSimple size={18} weight="bold" />
            Instalar aplicativo agora
          </button>
        ) : (
          <div className="space-y-3">
            {/* Passo a passo iPhone (destacado primeiro se iOS) */}
            <div
              className={`rounded-2xl border p-4 space-y-3 ${
                isIOS
                  ? "bg-[var(--surface-card)] border-[#18E299]/60 shadow-[var(--shadow-card)]"
                  : "bg-[var(--surface-card)] border-[var(--border-subtle)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  No iPhone / iPad (Safari)
                </span>
                {isIOS && (
                  <span className="font-mono-tech text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#18E299]/18 text-[var(--brand-deep)] font-semibold">
                    SEU APARELHO
                  </span>
                )}
              </div>

              <ol className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                <li className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] inline-flex items-center justify-center shrink-0">
                    <Export size={15} weight="bold" />
                  </span>
                  <span>
                    1. Toque no botão <strong>Compartilhar</strong> na barra do Safari.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] inline-flex items-center justify-center shrink-0">
                    <PlusSquare size={15} weight="bold" />
                  </span>
                  <span>
                    2. Role para baixo e escolha{" "}
                    <strong>Adicionar à Tela de Início</strong>.
                  </span>
                </li>
              </ol>
            </div>

            {/* Passo a passo Android */}
            {!isIOS && (
              <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 space-y-2.5">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  No Android (Chrome)
                </span>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="w-7 h-7 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] inline-flex items-center justify-center shrink-0">
                    <DotsThreeVertical size={16} weight="bold" />
                  </span>
                  <span>
                    Toque nos <strong>3 pontos</strong> no canto superior e selecione{" "}
                    <strong>Instalar aplicativo</strong> ou{" "}
                    <strong>Adicionar à tela inicial</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
        >
          Entendi
        </button>
      </div>
    </BottomSheet>
  );
}
