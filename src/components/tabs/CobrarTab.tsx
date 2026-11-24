"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRinging,
  Check,
  CheckCircle,
  Copy,
  Key,
  Plus,
  Sparkle,
  WarningCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import {
  buildWhatsappMessage,
  buildWhatsappUrl,
  formatUrgencyLabel,
  formatYearMonthLabel,
} from "@/lib/billing";
import { formatCentsBRL } from "@/lib/sanitize";
import type {
  AppSettings,
  ComputedChargeItem,
  MemberMonthlyGroup,
  MonthlySummary,
  Subscription,
} from "@/types/cobrar";
import {
  CategoryIcon,
  MemberMonogram,
  UrgencyBadge,
} from "@/components/ui/Primitives";
import { CotaMark } from "@/components/ui/CotaLogo";

interface CobrarTabProps {
  yearMonth: string;
  subscriptions: Subscription[];
  charges: ComputedChargeItem[];
  memberGroups: MemberMonthlyGroup[];
  summary: MonthlySummary;
  settings: AppSettings;
  onToggleChargePaid: (item: ComputedChargeItem) => void;
  onMarkMemberAllPaid: (group: MemberMonthlyGroup) => void;
  onOpenNewSubscription: () => void;
  onLoadSampleData: () => void;
  onGoToPixSettings: () => void;
  onCopyText: (text: string, feedbackMessage: string) => void;
}

export function CobrarTab({
  yearMonth,
  subscriptions,
  charges,
  memberGroups,
  summary,
  settings,
  onToggleChargePaid,
  onMarkMemberAllPaid,
  onOpenNewSubscription,
  onLoadSampleData,
  onGoToPixSettings,
  onCopyText,
}: CobrarTabProps) {
  const [viewMode, setViewMode] = useState<"member" | "subscription">("member");
  const [filterMode, setFilterMode] = useState<"pending" | "all">("pending");

  if (subscriptions.length === 0) {
    return (
      <div className="pt-2 space-y-5">
        <div className="pattern-10a-obsidian rounded-[24px] p-6 text-white border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono-tech inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-[#18E299] bg-[#18E299]/12 border border-[#18E299]/25 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18E299]" />
              100% NO SEU APARELHO
            </span>
            <CotaMark size={30} variant="dark" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight leading-snug mt-4">
            Cada cota da família{" "}
            <span className="text-[#18E299]">sempre em dia.</span>
          </h1>

          <p className="text-sm text-white/70 leading-relaxed mt-2.5">
            Cadastre os planos que você divide, receba alertas no vencimento e
            mande o resumo com sua chave PIX direto no WhatsApp em 1 toque.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onOpenNewSubscription}
              className="w-full h-12 rounded-full bg-[#18E299] hover:bg-[#0FA76E] text-[#0D0D0D] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <Plus size={18} weight="bold" />
              Criar primeira assinatura
            </button>

            <button
              type="button"
              onClick={onLoadSampleData}
              className="w-full h-11 rounded-full bg-white/8 hover:bg-white/12 border border-white/12 text-white/90 font-medium text-xs inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <Sparkle size={15} weight="duotone" className="text-[#18E299]" />
              Preencher com exemplo para testar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4">
            <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] block">
              PRIVACIDADE
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
              Sem nuvem externa
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Tudo fica salvo no armazenamento local do seu celular.
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4">
            <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] block">
              1 TOQUE
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
              Soma automática
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Quem divide 2 ou mais planos recebe uma cobrança única somada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPct =
    summary.totalReceivableCents > 0
      ? Math.min(
          100,
          Math.round(
            (summary.totalReceivedCents / summary.totalReceivableCents) * 100
          )
        )
      : 100;

  const handleChargePerson = (group: MemberMonthlyGroup) => {
    const unpaidItems = group.billableItems.filter((i) => !i.isPaid);
    const targetItems = unpaidItems.length > 0 ? unpaidItems : group.billableItems;
    if (targetItems.length === 0) return;

    const message = buildWhatsappMessage({
      memberName: group.member.name,
      yearMonth,
      items: targetItems,
      settings,
    });

    const waUrl = buildWhatsappUrl(group.member.phone, message);
    if (waUrl) {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      onCopyText(
        message,
        "Mensagem copiada! Cadastre o telefone da pessoa para abrir o WhatsApp direto."
      );
    }
  };

  const handleCopyPersonMessage = (group: MemberMonthlyGroup) => {
    const unpaidItems = group.billableItems.filter((i) => !i.isPaid);
    const targetItems = unpaidItems.length > 0 ? unpaidItems : group.billableItems;
    if (targetItems.length === 0) return;

    const message = buildWhatsappMessage({
      memberName: group.member.name,
      yearMonth,
      items: targetItems,
      settings,
    });
    onCopyText(message, `Cobrança de ${group.member.name.split(" ")[0]} copiada!`);
  };

  const handleChargeSingleItem = (item: ComputedChargeItem) => {
    const message = buildWhatsappMessage({
      memberName: item.memberName,
      yearMonth,
      items: [item],
      settings,
    });
    const waUrl = buildWhatsappUrl(item.memberPhone, message);
    if (waUrl) {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      onCopyText(message, "Mensagem copiada para a área de transferência!");
    }
  };

  const visibleMemberGroups =
    filterMode === "pending"
      ? memberGroups.filter((g) => g.pendingCents > 0)
      : memberGroups;

  const activeSubs = subscriptions
    .filter((s) => s.active)
    .sort((a, b) => a.billingDay - b.billingDay);

  return (
    <div className="space-y-4">
      {/* Painel Resumo Obsidian 10Ativas */}
      <section
        aria-label="Resumo financeiro do mês"
        className="pattern-10a-obsidian rounded-[24px] p-5 text-white border border-white/10 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono-tech text-[11px] uppercase tracking-[0.07em] text-white/65">
            FALTA RECEBER · {formatYearMonthLabel(yearMonth, true).toUpperCase()}
          </span>
          <span className="font-mono-tech text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-[#18E299]">
            {summary.paidChargesCount}/{summary.totalChargesCount} PAGOS
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-3">
          <p
            className={`font-mono-tech text-3xl sm:text-4xl font-bold tracking-tight ${
              summary.totalPendingCents === 0 && summary.totalReceivableCents > 0
                ? "text-[#18E299]"
                : "text-white"
            }`}
          >
            {formatCentsBRL(summary.totalPendingCents)}
          </p>
          <span className="font-mono-tech text-xs text-white/65">
            de {formatCentsBRL(summary.totalReceivableCents)}
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="mt-3.5 h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-[#18E299]"
          />
        </div>

        <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-2">
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-white/50 block">
              JÁ RECEBIDO
            </span>
            <span className="font-mono-tech text-xs sm:text-sm font-semibold text-[#18E299] mt-0.5 block">
              {formatCentsBRL(summary.totalReceivedCents)}
            </span>
          </div>
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-white/50 block">
              PLANOS ATIVOS
            </span>
            <span className="font-mono-tech text-xs sm:text-sm font-semibold text-white/90 mt-0.5 block">
              {formatCentsBRL(summary.totalSubscriptionsCostCents)}
            </span>
          </div>
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-white/50 block">
              SUA PARTE
            </span>
            <span className="font-mono-tech text-xs sm:text-sm font-semibold text-white/90 mt-0.5 block">
              {formatCentsBRL(summary.ownerNetCostCents)}
            </span>
          </div>
        </div>
      </section>

      {/* Alertas contextuais */}
      {(summary.overdueChargesCount > 0 || summary.dueTodayChargesCount > 0) && (
        <div
          className={`rounded-2xl px-4 py-3 border flex items-center gap-3 ${
            summary.overdueChargesCount > 0
              ? "bg-[var(--status-error-bg)] border-[var(--status-error)]/25 text-[var(--status-error)]"
              : "bg-[var(--status-warning-bg)] border-[var(--status-warning)]/25 text-[var(--status-warning)]"
          }`}
        >
          {summary.overdueChargesCount > 0 ? (
            <WarningCircle size={20} weight="fill" className="shrink-0" />
          ) : (
            <BellRinging size={20} weight="fill" className="shrink-0" />
          )}
          <p className="text-xs font-medium leading-snug">
            {summary.overdueChargesCount > 0 && (
              <>
                <strong>
                  {summary.overdueChargesCount}{" "}
                  {summary.overdueChargesCount === 1
                    ? "cobrança atrasada"
                    : "cobranças atrasadas"}
                </strong>{" "}
                neste mês.
              </>
            )}{" "}
            {summary.dueTodayChargesCount > 0 && (
              <>
                <strong>
                  {summary.dueTodayChargesCount}{" "}
                  {summary.dueTodayChargesCount === 1
                    ? "vence hoje"
                    : "vencem hoje"}
                </strong>
                . Aproveite para mandar no WhatsApp.
              </>
            )}
          </p>
        </div>
      )}

      {!settings.pixKey.trim() && summary.totalReceivableCents > 0 && (
        <button
          type="button"
          onClick={onGoToPixSettings}
          className="w-full rounded-2xl px-4 py-3 bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-left transition-transform active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[var(--brand-soft)] text-[var(--brand-deep)] flex items-center justify-center shrink-0">
              <Key size={16} weight="bold" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-primary)] block">
                Cadastre sua chave PIX
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] block truncate">
                Ela entra automaticamente na mensagem do WhatsApp
              </span>
            </div>
          </div>
          <ArrowRight
            size={16}
            weight="bold"
            className="text-[var(--text-tertiary)] shrink-0"
          />
        </button>
      )}

      {/* Barra de Modo e Filtro */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="inline-flex rounded-full bg-[var(--surface-muted)] p-1 border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setViewMode("member")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "member"
                ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Por pessoa
          </button>
          <button
            type="button"
            onClick={() => setViewMode("subscription")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "subscription"
                ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Por plano
          </button>
        </div>

        <div className="inline-flex rounded-full bg-[var(--surface-muted)] p-1 border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setFilterMode("pending")}
            className={`font-mono-tech px-3 py-1.5 rounded-full text-[11px] font-medium uppercase transition-all cursor-pointer ${
              filterMode === "pending"
                ? "bg-[#0D0D0D] text-[#18E299] dark:bg-[#18E299] dark:text-[#0D0D0D]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Faltam ({summary.totalChargesCount - summary.paidChargesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`font-mono-tech px-3 py-1.5 rounded-full text-[11px] font-medium uppercase transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-[#0D0D0D] text-[#18E299] dark:bg-[#18E299] dark:text-[#0D0D0D]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* LISTA POR PESSOA */}
      {viewMode === "member" ? (
        visibleMemberGroups.length === 0 ? (
          <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] inline-flex items-center justify-center mx-auto">
              <CheckCircle size={26} weight="fill" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {summary.totalReceivableCents > 0
                ? "Tudo recebido neste mês!"
                : "Nenhuma cobrança pendente"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-[28ch] mx-auto leading-relaxed">
              {summary.totalReceivableCents > 0
                ? `Todo mundo já pagou suas assinaturas de ${formatYearMonthLabel(yearMonth)}.`
                : "Adicione participantes nas suas assinaturas para acompanhar os pagamentos."}
            </p>
            {summary.totalReceivableCents > 0 && filterMode === "pending" && (
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--surface-muted)] text-[var(--text-primary)] cursor-pointer"
              >
                Ver comprovantes marcados
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMemberGroups.map((group) => {
              const worstItem = group.billableItems[0] || group.items[0];
              const badgeLabel = group.allPaid
                ? "TUDO PAGO"
                : worstItem
                ? formatUrgencyLabel(worstItem)
                : "CORTESIA";

              return (
                <motion.article
                  layout="position"
                  key={group.member.id}
                  className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3.5"
                >
                  {/* Cabecalho do membro */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <MemberMonogram name={group.member.name} />
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                          {group.member.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <UrgencyBadge
                            urgency={group.worstUrgency}
                            label={badgeLabel}
                          />
                          {group.member.relation && (
                            <span className="text-[11px] text-[var(--text-tertiary)] truncate">
                              {group.member.relation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono-tech text-base font-bold text-[var(--text-primary)] block">
                        {formatCentsBRL(
                          group.pendingCents > 0
                            ? group.pendingCents
                            : group.totalBillableCents
                        )}
                      </span>
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] block">
                        {group.pendingCents > 0
                          ? "A RECEBER"
                          : group.totalBillableCents > 0
                          ? "RECEBIDO"
                          : "ISENTO"}
                      </span>
                    </div>
                  </div>

                  {/* Itens que esta pessoa divide */}
                  <div className="divide-y divide-[var(--border-subtle)] rounded-2xl bg-[var(--surface-muted)]/55 border border-[var(--border-subtle)] px-3">
                    {group.items.map((item) => (
                      <button
                        key={item.cycleKey}
                        type="button"
                        disabled={item.isExempt}
                        onClick={() => onToggleChargePaid(item)}
                        className="w-full py-2.5 flex items-center justify-between gap-2 text-left disabled:cursor-default cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {!item.isExempt ? (
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-transform group-active:scale-90 shrink-0 ${
                                item.isPaid
                                  ? "bg-[#18E299] border-[#18E299] text-[#0D0D0D]"
                                  : "border-[var(--border-strong)] bg-[var(--surface-card)]"
                              }`}
                            >
                              {item.isPaid && <Check size={12} weight="bold" />}
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] shrink-0" />
                          )}

                          <div className="min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-medium block truncate ${
                                item.isPaid
                                  ? "line-through text-[var(--text-tertiary)]"
                                  : "text-[var(--text-primary)]"
                              }`}
                            >
                              {item.subscriptionName}
                            </span>
                            <span className="font-mono-tech text-[10px] text-[var(--text-tertiary)] uppercase block">
                              Venc. {item.dueDateFormatted}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`font-mono-tech text-xs font-semibold shrink-0 ${
                            item.isExempt
                              ? "text-[var(--text-tertiary)]"
                              : item.isPaid
                              ? "text-[var(--status-success)]"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          {item.isExempt
                            ? "CORTESIA"
                            : formatCentsBRL(item.amountCents)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Acoes rapidas 1-toque */}
                  {group.pendingCents > 0 && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleChargePerson(group)}
                        className="flex-1 h-11 rounded-full bg-[#18E299] hover:bg-[#0FA76E] text-[#0D0D0D] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
                      >
                        <WhatsappLogo size={18} weight="fill" />
                        Cobrar {formatCentsBRL(group.pendingCents)}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPersonMessage(group)}
                        aria-label="Copiar texto da cobrança"
                        title="Copiar texto da cobrança"
                        className="w-11 h-11 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center transition-transform active:scale-95 shrink-0 cursor-pointer"
                      >
                        <Copy size={17} weight="bold" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onMarkMemberAllPaid(group)}
                        className="h-11 px-4 rounded-full bg-[#0D0D0D] text-white dark:bg-white/10 dark:text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shrink-0 cursor-pointer"
                      >
                        <Check size={15} weight="bold" className="text-[#18E299]" />
                        Pago
                      </button>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        )
      ) : (
        /* LISTA POR ASSINATURA */
        <div className="space-y-3">
          {activeSubs.map((sub) => {
            const subCharges = charges.filter((c) => c.subscriptionId === sub.id);
            const visibleSubCharges =
              filterMode === "pending"
                ? subCharges.filter((c) => !c.isExempt && !c.isPaid)
                : subCharges;

            if (filterMode === "pending" && visibleSubCharges.length === 0) {
              return null;
            }

            const billable = subCharges.filter((c) => !c.isExempt);
            const paidCount = billable.filter((c) => c.isPaid).length;

            return (
              <article
                key={sub.id}
                className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--surface-muted)] text-[var(--text-primary)] inline-flex items-center justify-center shrink-0">
                      <CategoryIcon category={sub.category} size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                        {sub.name}
                      </h3>
                      <span className="font-mono-tech text-[11px] text-[var(--text-tertiary)] uppercase">
                        DIA {String(sub.billingDay).padStart(2, "0")} ·{" "}
                        {paidCount}/{billable.length} PAGOS
                      </span>
                    </div>
                  </div>

                  <span className="font-mono-tech text-sm font-semibold text-[var(--text-primary)] shrink-0">
                    {formatCentsBRL(sub.totalCents)}
                  </span>
                </div>

                {visibleSubCharges.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)] py-1">
                    Nenhuma pessoa vinculada a este plano.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)] pt-1">
                    {visibleSubCharges.map((item) => (
                      <div
                        key={item.cycleKey}
                        className="py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MemberMonogram name={item.memberName} size="sm" />
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] block truncate">
                              {item.memberName}
                            </span>
                            <span className="font-mono-tech text-[11px] text-[var(--text-secondary)]">
                              {item.isExempt
                                ? "CORTESIA"
                                : formatCentsBRL(item.amountCents)}
                            </span>
                          </div>
                        </div>

                        {!item.isExempt && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!item.isPaid && (
                              <button
                                type="button"
                                onClick={() => handleChargeSingleItem(item)}
                                aria-label={`Cobrar ${item.memberName} no WhatsApp`}
                                className="w-9 h-9 rounded-full bg-[#18E299]/18 text-[var(--brand-deep)] inline-flex items-center justify-center active:scale-95 cursor-pointer"
                              >
                                <WhatsappLogo size={17} weight="fill" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onToggleChargePaid(item)}
                              className={`font-mono-tech h-9 px-3 rounded-full text-[11px] font-semibold uppercase inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                                item.isPaid
                                  ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                                  : "bg-[#0D0D0D] text-white dark:bg-white/12"
                              }`}
                            >
                              <Check size={13} weight="bold" />
                              {item.isPaid ? "Pago" : "Receber"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
