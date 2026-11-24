"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BellRinging,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  Receipt,
  SlidersHorizontal,
  Stack,
  Users,
  X,
} from "@phosphor-icons/react";
import {
  computeMonthlyCharges,
  computeMonthlySummary,
  formatYearMonthLabel,
  getCurrentYearMonth,
  groupChargesByMember,
  shiftYearMonth,
} from "@/lib/billing";
import {
  checkAndTriggerDailyReminder,
  registerCobrarServiceWorker,
} from "@/lib/notifications";
import { createSampleDataset } from "@/lib/presets";
import {
  createEmptyStore,
  exportStoreAsJsonFile,
  generateId,
  loadStoreFromLocalStorage,
  normalizeStore,
  saveStoreToLocalStorage,
} from "@/lib/storage";
import type {
  AppSettings,
  AppTab,
  CobrarStoreV1,
  ComputedChargeItem,
  Member,
  MemberMonthlyGroup,
  Subscription,
} from "@/types/cobrar";
import { MemberSheet } from "@/components/modals/MemberSheet";
import { PwaInstallSheet } from "@/components/modals/PwaInstallSheet";
import { SubscriptionSheet } from "@/components/modals/SubscriptionSheet";
import { CobrarTab } from "@/components/tabs/CobrarTab";
import { FamilyTab } from "@/components/tabs/FamilyTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";
import { SubscriptionsTab } from "@/components/tabs/SubscriptionsTab";
import { CotaLogo } from "@/components/ui/CotaLogo";
import { ToastBanner, type ToastData } from "@/components/ui/Primitives";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const emptySubscribe = () => () => {};

function readInitialTab(): AppTab {
  if (typeof window === "undefined") return "cobrar";
  const tabParam = new URLSearchParams(window.location.search).get("tab");
  if (
    tabParam === "cobrar" ||
    tabParam === "assinaturas" ||
    tabParam === "familia" ||
    tabParam === "ajustes"
  ) {
    return tabParam;
  }
  return "cobrar";
}

function readInitialOpenNew(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("new") === "1";
}

function readInitialStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
  );
}

function CobrarWorkspace() {
  const [store, setStore] = useState<CobrarStoreV1>(() =>
    loadStoreFromLocalStorage()
  );
  const [activeTab, setActiveTab] = useState<AppTab>(() => readInitialTab());
  const [yearMonth, setYearMonth] = useState<string>(() => getCurrentYearMonth());

  // Modais
  const [subSheetOpen, setSubSheetOpen] = useState<boolean>(() =>
    readInitialOpenNew()
  );
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Toast
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PWA Install state
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() =>
    readInitialStandalone()
  );
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false);
  const [pwaGuideOpen, setPwaGuideOpen] = useState(false);

  const showToast = useCallback(
    (message: string, undoLabel?: string, onUndo?: () => void) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      const id = generateId("toast");
      setToast({ id, message, undoLabel, onUndo });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 4500);
    },
    []
  );

  // Registro do Service Worker e listener de instalacao PWA
  useEffect(() => {
    registerCobrarServiceWorker();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Persistencia automatica em LocalStorage e sincronizacao de tema
  useEffect(() => {
    saveStoreToLocalStorage(store);
    const root = document.documentElement;
    if (store.settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [store]);

  // Motor automatico de lembretes (ao abrir e ao retornar para o app)
  useEffect(() => {
    let cancelled = false;
    const evaluate = async () => {
      const notifiedDate = await checkAndTriggerDailyReminder(store);
      if (!cancelled && notifiedDate) {
        setStore((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            notifications: {
              ...prev.settings.notifications,
              lastNotifiedDate: notifiedDate,
            },
          },
        }));
      }
    };

    evaluate();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        evaluate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [store]);

  const currentYM = getCurrentYearMonth();

  const charges = useMemo(
    () =>
      computeMonthlyCharges(
        yearMonth,
        store.subscriptions,
        store.members,
        store.payments
      ),
    [yearMonth, store.subscriptions, store.members, store.payments]
  );

  const memberGroups = useMemo(
    () => groupChargesByMember(charges, store.members),
    [charges, store.members]
  );

  const summary = useMemo(
    () => computeMonthlySummary(yearMonth, store.subscriptions, charges),
    [yearMonth, store.subscriptions, charges]
  );

  // Handlers de Pagamento Mensal
  const handleToggleChargePaid = useCallback(
    (item: ComputedChargeItem) => {
      if (item.isExempt) return;
      const prevEntry = store.payments[item.cycleKey];
      const nextPaid = !item.isPaid;

      setStore((prev) => {
        const nextPayments = { ...prev.payments };
        if (nextPaid) {
          nextPayments[item.cycleKey] = {
            status: "paid",
            amountPaidCents: item.amountCents,
            paidAt: new Date().toISOString(),
          };
        } else {
          delete nextPayments[item.cycleKey];
        }
        return { ...prev, payments: nextPayments };
      });

      const firstName = item.memberName.split(" ")[0];
      showToast(
        nextPaid
          ? `${firstName} marcado como pago (${item.subscriptionName})`
          : `Pagamento de ${firstName} reaberto`,
        "Desfazer",
        () => {
          setStore((prev) => {
            const reverted = { ...prev.payments };
            if (prevEntry) {
              reverted[item.cycleKey] = prevEntry;
            } else {
              delete reverted[item.cycleKey];
            }
            return { ...prev, payments: reverted };
          });
        }
      );
    },
    [store.payments, showToast]
  );

  const handleMarkMemberAllPaid = useCallback(
    (group: MemberMonthlyGroup) => {
      const unpaid = group.billableItems.filter((i) => !i.isPaid);
      if (unpaid.length === 0) return;

      const snapshotKeys = unpaid.map((i) => i.cycleKey);
      const nowIso = new Date().toISOString();

      setStore((prev) => {
        const nextPayments = { ...prev.payments };
        for (const item of unpaid) {
          nextPayments[item.cycleKey] = {
            status: "paid",
            amountPaidCents: item.amountCents,
            paidAt: nowIso,
          };
        }
        return { ...prev, payments: nextPayments };
      });

      const firstName = group.member.name.split(" ")[0];
      showToast(
        `Tudo de ${firstName} marcado como pago!`,
        "Desfazer",
        () => {
          setStore((prev) => {
            const reverted = { ...prev.payments };
            for (const key of snapshotKeys) {
              delete reverted[key];
            }
            return { ...prev, payments: reverted };
          });
        }
      );
    },
    [showToast]
  );

  // Handlers de Membros
  const handleQuickCreateMember = useCallback(
    (data: { name: string; phone: string; relation?: string }): Member => {
      const created: Member = {
        id: generateId("mem"),
        name: data.name,
        phone: data.phone,
        relation: data.relation,
        createdAt: new Date().toISOString(),
      };
      setStore((prev) => ({
        ...prev,
        members: [...prev.members, created],
      }));
      return created;
    },
    []
  );

  const handleSaveMember = useCallback(
    (
      data: {
        name: string;
        phone: string;
        relation?: string;
        subscriptionIds: string[];
      },
      existingId?: string
    ) => {
      const targetId = existingId || generateId("mem");
      const nowIso = new Date().toISOString();

      setStore((prev) => {
        const nextMembers = existingId
          ? prev.members.map((m) =>
              m.id === existingId
                ? {
                    ...m,
                    name: data.name,
                    phone: data.phone,
                    relation: data.relation,
                  }
                : m
            )
          : [
              ...prev.members,
              {
                id: targetId,
                name: data.name,
                phone: data.phone,
                relation: data.relation,
                createdAt: nowIso,
              },
            ];

        const nextSubs = prev.subscriptions.map((sub) => {
          const shouldInclude = data.subscriptionIds.includes(sub.id);
          const exists = sub.participants.some((p) => p.memberId === targetId);
          if (shouldInclude && !exists) {
            return {
              ...sub,
              participants: [...sub.participants, { memberId: targetId }],
            };
          }
          if (!shouldInclude && exists) {
            return {
              ...sub,
              participants: sub.participants.filter(
                (p) => p.memberId !== targetId
              ),
            };
          }
          return sub;
        });

        return {
          ...prev,
          members: nextMembers,
          subscriptions: nextSubs,
        };
      });

      showToast(
        existingId ? "Pessoa atualizada." : "Pessoa adicionada à família."
      );
    },
    [showToast]
  );

  const handleDeleteMember = useCallback(
    (memberId: string) => {
      setStore((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        subscriptions: prev.subscriptions.map((s) => ({
          ...s,
          participants: s.participants.filter((p) => p.memberId !== memberId),
        })),
      }));
      showToast("Pessoa removida da família.");
    },
    [showToast]
  );

  // Handlers de Assinaturas
  const handleSaveSubscription = useCallback(
    (data: Omit<Subscription, "id" | "createdAt">, existingId?: string) => {
      setStore((prev) => {
        if (existingId) {
          return {
            ...prev,
            subscriptions: prev.subscriptions.map((s) =>
              s.id === existingId ? { ...s, ...data } : s
            ),
          };
        }
        const created: Subscription = {
          ...data,
          id: generateId("sub"),
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          subscriptions: [...prev.subscriptions, created],
        };
      });
      showToast(
        existingId ? "Assinatura atualizada." : "Assinatura criada com sucesso!"
      );
    },
    [showToast]
  );

  const handleDeleteSubscription = useCallback(
    (subId: string) => {
      setStore((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.filter((s) => s.id !== subId),
      }));
      showToast("Assinatura excluída.");
    },
    [showToast]
  );

  // Ajustes, Exemplo e Backup
  const handleUpdateSettings = useCallback((patch: Partial<AppSettings>) => {
    setStore((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
      },
    }));
  }, []);

  const handleLoadSampleData = useCallback(() => {
    const sample = createSampleDataset();
    setStore((prev) => ({
      ...prev,
      members: sample.members,
      subscriptions: sample.subscriptions,
      payments: sample.payments,
    }));
    showToast("Dados de exemplo carregados! Pode testar à vontade.");
  }, [showToast]);

  const handleCopyText = useCallback(
    async (text: string, feedbackMessage: string) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          showToast(feedbackMessage);
          return;
        }
      } catch {
        // Continua para fallback compativel com HTTP IP local
      }

      try {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(area);
        showToast(
          copied
            ? feedbackMessage
            : "Não foi possível copiar automaticamente."
        );
      } catch {
        showToast("Não foi possível copiar automaticamente.");
      }
    },
    [showToast]
  );

  const handleTriggerInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setIsStandalone(true);
      showToast("Aplicativo instalado no seu aparelho!");
    }
  }, [installPrompt, showToast]);

  const handleImportBackupFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const restored = normalizeStore(parsed);
        setStore(restored);
        showToast("Backup restaurado com sucesso neste aparelho!");
      } catch {
        showToast("Arquivo de backup inválido ou corrompido.");
      }
    },
    [showToast]
  );

  const handleResetAllData = useCallback(() => {
    const clean = createEmptyStore();
    clean.settings.theme = store.settings.theme;
    setStore(clean);
    showToast("Todos os dados locais foram apagados.");
  }, [store.settings.theme, showToast]);

  const urgentCount = summary.overdueChargesCount + summary.dueTodayChargesCount;
  const pendingCount = summary.totalChargesCount - summary.paidChargesCount;

  const navItems: {
    id: AppTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    {
      id: "cobrar",
      label: "Cobrar",
      icon: Receipt,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: "assinaturas",
      label: "Planos",
      icon: Stack,
    },
    {
      id: "familia",
      label: "Família",
      icon: Users,
    },
    {
      id: "ajustes",
      label: "Ajustes",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-[520px] mx-auto bg-[var(--surface-bg)] sm:border-x sm:border-[var(--border-subtle)] relative">
      {/* HEADER STICKY 10ATIVAS */}
      <header
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        className="sticky top-0 z-30 bg-[var(--surface-bg)]/88 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 pb-3"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("cobrar")}
            className="text-left cursor-pointer"
          >
            <CotaLogo size="md" />
          </button>

          <div className="flex items-center gap-1.5">
            {activeTab === "cobrar" && (
              <div className="inline-flex items-center rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] p-0.5">
                <button
                  type="button"
                  onClick={() => setYearMonth((ym) => shiftYearMonth(ym, -1))}
                  aria-label="Mês anterior"
                  className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 cursor-pointer"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setYearMonth(currentYM)}
                  title="Voltar para o mês atual"
                  className="font-mono-tech px-2 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-tight cursor-pointer"
                >
                  {formatYearMonthLabel(yearMonth, true)}
                </button>
                <button
                  type="button"
                  onClick={() => setYearMonth((ym) => shiftYearMonth(ym, 1))}
                  aria-label="Próximo mês"
                  className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 cursor-pointer"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            )}

            {!isStandalone && (
              <button
                type="button"
                onClick={() => setPwaGuideOpen(true)}
                aria-label="Baixar app na tela inicial"
                title="Baixar app na tela inicial"
                className="w-9 h-9 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] inline-flex items-center justify-center text-[var(--brand-deep)] active:scale-95 cursor-pointer"
              >
                <DownloadSimple size={17} weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("ajustes")}
              aria-label="Configurar notificações"
              className="relative w-9 h-9 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer"
            >
              {store.settings.notifications.enabled ? (
                <BellRinging
                  size={17}
                  weight="fill"
                  className="text-[var(--brand-deep)]"
                />
              ) : (
                <Bell size={17} weight="bold" />
              )}
              {urgentCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--status-error)] ring-2 ring-[var(--surface-bg)]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Banner discreto de instalacao PWA quando disponivel no celular */}
      {installPrompt && !isStandalone && !installBannerDismissed && (
        <div className="px-4 pt-3">
          <div className="rounded-2xl bg-[#0D0D0D] text-white px-3.5 py-2.5 flex items-center justify-between gap-2 border border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <DownloadSimple
                size={17}
                weight="bold"
                className="text-[#18E299] shrink-0"
              />
              <span className="text-xs font-medium truncate">
                Baixe na tela inicial para usar offline
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleTriggerInstall}
                className="px-3 py-1 rounded-full bg-[#18E299] text-[#0D0D0D] text-xs font-semibold cursor-pointer"
              >
                Instalar
              </button>
              <button
                type="button"
                onClick={() => setInstallBannerDismissed(true)}
                aria-label="Dispensar aviso de instalação"
                className="p-1 text-white/60 hover:text-white cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEUDO PRINCIPAL */}
      <main
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
        className="flex-1 px-4 pt-4"
      >
        {activeTab === "cobrar" && (
          <CobrarTab
            yearMonth={yearMonth}
            subscriptions={store.subscriptions}
            charges={charges}
            memberGroups={memberGroups}
            summary={summary}
            settings={store.settings}
            onToggleChargePaid={handleToggleChargePaid}
            onMarkMemberAllPaid={handleMarkMemberAllPaid}
            onOpenNewSubscription={() => {
              setEditingSub(null);
              setSubSheetOpen(true);
            }}
            onLoadSampleData={handleLoadSampleData}
            onGoToPixSettings={() => setActiveTab("ajustes")}
            onCopyText={handleCopyText}
          />
        )}

        {activeTab === "assinaturas" && (
          <SubscriptionsTab
            subscriptions={store.subscriptions}
            members={store.members}
            onAdd={() => {
              setEditingSub(null);
              setSubSheetOpen(true);
            }}
            onEdit={(sub) => {
              setEditingSub(sub);
              setSubSheetOpen(true);
            }}
          />
        )}

        {activeTab === "familia" && (
          <FamilyTab
            members={store.members}
            subscriptions={store.subscriptions}
            onAdd={() => {
              setEditingMember(null);
              setMemberSheetOpen(true);
            }}
            onEdit={(member) => {
              setEditingMember(member);
              setMemberSheetOpen(true);
            }}
          />
        )}

        {activeTab === "ajustes" && (
          <SettingsTab
            store={store}
            installPrompt={installPrompt}
            isStandalone={isStandalone}
            onTriggerInstall={handleTriggerInstall}
            onOpenInstallGuide={() => setPwaGuideOpen(true)}
            onUpdateSettings={handleUpdateSettings}
            onExportBackup={() => {
              exportStoreAsJsonFile(store);
              showToast("Arquivo de backup salvo no seu aparelho!");
            }}
            onImportBackupFile={handleImportBackupFile}
            onResetAllData={handleResetAllData}
            onCopyText={handleCopyText}
            onShowToast={(msg) => showToast(msg)}
          />
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR MOBILE-FIRST */}
      <nav
        aria-label="Navegação principal"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        className="fixed bottom-0 left-0 right-0 z-30 max-w-[520px] mx-auto bg-[var(--surface-card)]/92 backdrop-blur-xl border-t border-[var(--border-subtle)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
      >
        <div className="grid grid-cols-4 px-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="relative py-1.5 flex flex-col items-center justify-center gap-1 rounded-2xl transition-transform active:scale-95 cursor-pointer"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-x-2 inset-y-0.5 rounded-2xl bg-[var(--brand-soft)] -z-10"
                  />
                )}

                <div className="relative">
                  <Icon
                    size={22}
                    weight={isActive ? "fill" : "regular"}
                    className={
                      isActive
                        ? "text-[var(--brand-deep)]"
                        : "text-[var(--text-tertiary)]"
                    }
                  />
                  {item.badge !== undefined && (
                    <span className="font-mono-tech absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#18E299] text-[#0D0D0D] text-[10px] font-bold inline-flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] font-semibold tracking-tight ${
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MODAIS MOBILE BOTTOM SHEET */}
      <SubscriptionSheet
        open={subSheetOpen}
        onClose={() => {
          setSubSheetOpen(false);
          setEditingSub(null);
        }}
        editing={editingSub}
        members={store.members}
        onQuickCreateMember={handleQuickCreateMember}
        onSave={handleSaveSubscription}
        onDelete={handleDeleteSubscription}
      />

      <MemberSheet
        open={memberSheetOpen}
        onClose={() => {
          setMemberSheetOpen(false);
          setEditingMember(null);
        }}
        editing={editingMember}
        subscriptions={store.subscriptions}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
      />

      <PwaInstallSheet
        open={pwaGuideOpen}
        onClose={() => setPwaGuideOpen(false)}
        isStandalone={isStandalone}
        canDirectInstall={Boolean(installPrompt)}
        onTriggerDirectInstall={handleTriggerInstall}
      />

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export function CobrarApp() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="min-h-[100dvh] max-w-[520px] mx-auto px-4 pt-5 pb-28 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-28 rounded-full bg-[var(--surface-muted)] animate-pulse" />
          <div className="h-8 w-32 rounded-full bg-[var(--surface-muted)] animate-pulse" />
        </div>
        <div className="h-44 rounded-[24px] bg-[var(--surface-muted)] animate-pulse" />
        <div className="h-10 rounded-full bg-[var(--surface-muted)] animate-pulse" />
        <div className="h-36 rounded-[20px] bg-[var(--surface-muted)] animate-pulse" />
        <div className="h-36 rounded-[20px] bg-[var(--surface-muted)] animate-pulse" />
      </div>
    );
  }

  return <CobrarWorkspace />;
}
