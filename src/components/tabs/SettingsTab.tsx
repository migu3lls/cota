"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowCounterClockwise,
  Bell,
  BellRinging,
  CheckCircle,
  Copy,
  DeviceMobile,
  DownloadSimple,
  Export,
  Key,
  Moon,
  ShareNetwork,
  Sun,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import {
  detectNotificationSupport,
  dispatchLocalNotification,
  requestDeviceNotificationPermission,
  type BrowserNotificationSupport,
} from "@/lib/notifications";
import { DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/presets";
import type { AppSettings, CobrarStoreV1, PixKeyType } from "@/types/cobrar";
import { CotaLogo, CotaPwaIconPreview } from "@/components/ui/CotaLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface SettingsTabProps {
  store: CobrarStoreV1;
  installPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  onTriggerInstall: () => Promise<void>;
  onOpenInstallGuide: () => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onExportBackup: () => void;
  onImportBackupFile: (file: File) => void;
  onResetAllData: () => void;
  onCopyText: (text: string, feedback: string) => void;
  onShowToast: (message: string) => void;
}

const PIX_TYPES: { value: PixKeyType; label: string }[] = [
  { value: "celular", label: "Celular" },
  { value: "cpf", label: "CPF / CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "aleatoria", label: "Aleatória" },
];

export function SettingsTab({
  store,
  installPrompt,
  isStandalone,
  onTriggerInstall,
  onOpenInstallGuide,
  onUpdateSettings,
  onExportBackup,
  onImportBackupFile,
  onResetAllData,
  onCopyText,
  onShowToast,
}: SettingsTabProps) {
  const { settings } = store;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [notifSupport, setNotifSupport] = useState<BrowserNotificationSupport>(() =>
    detectNotificationSupport()
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const handleToggleNotifications = async () => {
    const support = detectNotificationSupport();
    setNotifSupport(support);

    if (settings.notifications.enabled) {
      onUpdateSettings({
        notifications: { ...settings.notifications, enabled: false },
      });
      onShowToast("Lembretes desativados neste aparelho.");
      return;
    }

    if (support === "ios-needs-install") {
      onShowToast(
        "No iPhone, adicione o app à Tela de Início primeiro para liberar notificações."
      );
      return;
    }

    if (support === "unsupported") {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        onUpdateSettings({
          notifications: { ...settings.notifications, enabled: true },
        });
        onShowToast(
          "Modo rede local (HTTP): lembretes internos ativados! Para notificações do sistema no celular, use HTTPS."
        );
        return;
      }
      onShowToast("Este navegador não suporta notificações locais.");
      return;
    }

    const permission = await requestDeviceNotificationPermission();
    setNotifSupport(permission);

    if (permission === "granted") {
      onUpdateSettings({
        notifications: { ...settings.notifications, enabled: true },
      });
      await dispatchLocalNotification(
        "Notificações ativadas · Cota",
        "Você será avisado no aparelho quando chegar o dia de cobrar sua família.",
        "cota-boas-vindas"
      );
      onShowToast("Notificações ativadas com sucesso!");
    } else {
      onShowToast(
        "Permissão negada no navegador. Libere nas configurações do site no celular."
      );
    }
  };

  const handleTestNotification = async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      onShowToast(
        "Simulação via IP local: Hora de cobrar sua família! (Em HTTPS vira notificação nativa do celular)"
      );
      return;
    }

    const permission = await requestDeviceNotificationPermission();
    setNotifSupport(permission);

    if (permission !== "granted") {
      onShowToast("Ative a permissão de notificações primeiro.");
      return;
    }

    const ok = await dispatchLocalNotification(
      "Teste de lembrete · Cota",
      "Tudo certo! É assim que você será lembrado nos dias de vencimento.",
      "cota-teste"
    );
    onShowToast(
      ok
        ? "Notificação enviada para o seu aparelho!"
        : "Não foi possível exibir a notificação agora."
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Ajustes & Aparelho
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">
          PIX, lembretes automáticos, instalação e backup local
        </p>
      </div>

      {/* 1. CHAVE PIX */}
      <section className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--brand-soft)] text-[var(--brand-deep)] inline-flex items-center justify-center">
              <Key size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Sua Chave PIX
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Incluída automaticamente nas cobranças
              </p>
            </div>
          </div>

          {settings.pixKey.trim() && (
            <button
              type="button"
              onClick={() =>
                onCopyText(settings.pixKey.trim(), "Chave PIX copiada!")
              }
              className="h-8 px-3 rounded-full bg-[var(--surface-muted)] text-xs font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Copy size={13} weight="bold" />
              Copiar
            </button>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {PIX_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onUpdateSettings({ pixKeyType: t.value })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                settings.pixKeyType === t.value
                  ? "bg-[#0D0D0D] text-[#18E299] dark:bg-[#18E299] dark:text-[#0D0D0D]"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={settings.pixKey}
          onChange={(e) => onUpdateSettings({ pixKey: e.target.value })}
          placeholder="Digite sua chave PIX aqui"
          className="font-mono-tech w-full h-11 px-4 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#18E299] focus:ring-2 focus:ring-[#18E299]/25"
        />
      </section>

      {/* 2. NOTIFICACOES DO APARELHO */}
      <section className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] inline-flex items-center justify-center shrink-0">
              {settings.notifications.enabled ? (
                <BellRinging size={18} weight="fill" className="text-[#0FA76E]" />
              ) : (
                <Bell size={18} weight="bold" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Notificações de cobrança
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {notifSupport === "granted" && settings.notifications.enabled
                  ? "Ativas neste aparelho"
                  : notifSupport === "denied"
                  ? "Bloqueadas nas permissões do navegador"
                  : notifSupport === "ios-needs-install"
                  ? "Instale na Tela de Início (iOS) para ativar"
                  : "Receba alertas nos vencimentos e atrasos"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`h-9 px-4 rounded-full text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer ${
              settings.notifications.enabled
                ? "bg-[#18E299] text-[#0D0D0D]"
                : "bg-[#0D0D0D] text-white dark:bg-white/12"
            }`}
          >
            {settings.notifications.enabled ? "Ativado" : "Ativar"}
          </button>
        </div>

        <div className="space-y-2.5 pt-1 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--text-secondary)]">
              Quando avisar antes do vencimento
            </span>
            <select
              value={settings.notifications.remindDaysBefore}
              onChange={(e) =>
                onUpdateSettings({
                  notifications: {
                    ...settings.notifications,
                    remindDaysBefore: Number(e.target.value),
                  },
                })
              }
              className="h-9 px-3 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[#18E299]"
            >
              <option value={0}>No dia do vencimento</option>
              <option value={1}>1 dia antes + no dia</option>
              <option value={2}>2 dias antes + no dia</option>
              <option value={3}>3 dias antes + no dia</option>
            </select>
          </div>

          <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
            <span className="text-xs text-[var(--text-secondary)]">
              Lembrar quando houver cobrança atrasada
            </span>
            <input
              type="checkbox"
              checked={settings.notifications.remindOverdue}
              onChange={(e) =>
                onUpdateSettings({
                  notifications: {
                    ...settings.notifications,
                    remindOverdue: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 accent-[#18E299] cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={handleTestNotification}
            className="w-full h-10 rounded-full bg-[var(--surface-muted)] hover:bg-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] inline-flex items-center justify-center gap-1.5 transition-transform active:scale-[0.99] cursor-pointer"
          >
            <BellRinging size={15} weight="bold" />
            Disparar notificação de teste agora
          </button>
        </div>
      </section>

      {/* 3. INSTALAR NO APARELHO (PWA) */}
      <section className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CotaPwaIconPreview size={48} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <DeviceMobile size={15} weight="bold" className="text-[var(--brand-deep)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  App Cota na Tela de Início
                </h2>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                Ícone anti-zoom calibrado para iPhone e Android, funciona offline
              </p>
            </div>
          </div>
        </div>

        {isStandalone ? (
          <div className="rounded-2xl bg-[var(--status-success-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--status-success)] inline-flex items-center gap-2 w-full">
            <CheckCircle size={17} weight="fill" />
            Cota já instalado e rodando em tela cheia no seu aparelho.
          </div>
        ) : installPrompt ? (
          <button
            type="button"
            onClick={onTriggerInstall}
            className="w-full h-11 rounded-full bg-[#18E299] hover:bg-[#0FA76E] text-[#0D0D0D] font-semibold text-xs inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <DownloadSimple size={17} weight="bold" />
            Instalar Cota no aparelho
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenInstallGuide}
            className="w-full h-11 rounded-full bg-[#0D0D0D] text-[#18E299] dark:bg-[#18E299] dark:text-[#0D0D0D] font-semibold text-xs inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <ShareNetwork size={16} weight="bold" />
            Ver como instalar no iPhone / Android
          </button>
        )}
      </section>

      {/* 4. MENSAGEM DO WHATSAPP & TEMA */}
      <section className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Texto padrão do WhatsApp
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Variáveis: {"{nome}"}, {"{mes}"}, {"{itens}"}, {"{total}"},{" "}
              {"{pix}"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE })
            }
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            Padrão
          </button>
        </div>

        <textarea
          rows={5}
          value={settings.whatsappTemplate}
          onChange={(e) =>
            onUpdateSettings({ whatsappTemplate: e.target.value })
          }
          className="w-full rounded-2xl p-3.5 bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base sm:text-sm text-[var(--text-primary)] leading-relaxed focus:outline-none focus:border-[#18E299]"
        />

        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--text-primary)]">
            Aparência da interface
          </span>
          <div className="inline-flex rounded-full bg-[var(--surface-muted)] p-1 border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: "light" })}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                settings.theme === "light"
                  ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <Sun size={14} weight="bold" />
              Claro
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: "dark" })}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                settings.theme === "dark"
                  ? "bg-[#0D0D0D] text-[#18E299]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <Moon size={14} weight="bold" />
              Obsidian
            </button>
          </div>
        </div>
      </section>

      {/* 5. ARMAZENAMENTO LOCAL & BACKUP */}
      <section className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3">
        <div>
          <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[#0FA76E] block">
            LOCAL STORAGE · PRIVADO
          </span>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
            Backup dos seus dados no aparelho
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            {store.members.length} pessoas · {store.subscriptions.length}{" "}
            assinaturas · {Object.keys(store.payments).length} registros salvos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onExportBackup}
            className="h-11 rounded-full bg-[#0D0D0D] text-white dark:bg-white/10 font-semibold text-xs inline-flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Export size={16} weight="bold" className="text-[#18E299]" />
            Exportar .JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold text-xs inline-flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <UploadSimple size={16} weight="bold" />
            Restaurar .JSON
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportBackupFile(file);
                e.target.value = "";
              }
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              return;
            }
            onResetAllData();
            setConfirmReset(false);
          }}
          className={`w-full h-10 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            confirmReset
              ? "bg-[var(--status-error)] text-white"
              : "bg-[var(--status-error-bg)] text-[var(--status-error)]"
          }`}
        >
          <Trash size={14} weight="bold" />
          {confirmReset
            ? "Toque novamente para zerar tudo deste aparelho"
            : "Limpar todos os dados locais"}
        </button>
      </section>

      {/* Assinatura Institucional Cota + 10Ativas V2 */}
      <footer className="py-5 flex flex-col items-center justify-center gap-2.5 opacity-85">
        <CotaLogo size="sm" showSubtag={false} />
        <div className="flex items-center gap-2">
          <Image
            src={
              settings.theme === "dark"
                ? "/brand/logo-compacta-dark.svg"
                : "/brand/logo-compacta.svg"
            }
            alt="10Ativas"
            width={56}
            height={20}
            className="h-4 w-auto object-contain opacity-80"
          />
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            · 100% LOCAL NO APARELHO
          </span>
        </div>
      </footer>
    </div>
  );
}
