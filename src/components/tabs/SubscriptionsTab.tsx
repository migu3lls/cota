"use client";

import React from "react";
import {
  CalendarBlank,
  PencilSimple,
  Plus,
  UsersThree,
} from "@phosphor-icons/react";
import { calculateParticipantShareCents } from "@/lib/billing";
import { CATEGORY_LABELS } from "@/lib/presets";
import { formatCentsBRL } from "@/lib/sanitize";
import type { Member, Subscription } from "@/types/cobrar";
import { CategoryIcon, MemberMonogram } from "@/components/ui/Primitives";

interface SubscriptionsTabProps {
  subscriptions: Subscription[];
  members: Member[];
  onAdd: () => void;
  onEdit: (sub: Subscription) => void;
}

export function SubscriptionsTab({
  subscriptions,
  members,
  onAdd,
  onEdit,
}: SubscriptionsTabProps) {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const sorted = [...subscriptions].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.billingDay - b.billingDay;
  });

  const activeSubs = subscriptions.filter((s) => s.active);
  const totalGrossCents = activeSubs.reduce((acc, s) => acc + s.totalCents, 0);
  const totalRecoveredCents = activeSubs.reduce((acc, sub) => {
    const recovered = sub.participants.reduce(
      (sum, p) => sum + calculateParticipantShareCents(sub, p),
      0
    );
    return acc + recovered;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Assinaturas
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Planos que você gerencia e divide todo mês
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="h-10 px-4 rounded-full bg-[#18E299] hover:bg-[#0FA76E] text-[#0D0D0D] font-semibold text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          Novo plano
        </button>
      </div>

      {activeSubs.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] block">
              CUSTO BRUTO MENSAL
            </span>
            <span className="font-mono-tech text-lg font-bold text-[var(--text-primary)] mt-1 block">
              {formatCentsBRL(totalGrossCents)}
            </span>
          </div>

          <div className="rounded-2xl bg-[var(--brand-soft)] border border-[#0FA76E]/20 p-4">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--brand-deep)] block">
              ECONOMIA COM A FAMÍLIA
            </span>
            <span className="font-mono-tech text-lg font-bold text-[var(--brand-deep)] mt-1 block">
              {formatCentsBRL(totalRecoveredCents)}/mês
            </span>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-muted)] text-[var(--text-secondary)] inline-flex items-center justify-center mx-auto">
            <UsersThree size={24} weight="duotone" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Nenhuma assinatura cadastrada
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-[30ch] mx-auto leading-relaxed">
              Adicione YouTube, Spotify, iCloud, Netflix ou qualquer plano que você divide.
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="h-11 px-5 rounded-full bg-[#0D0D0D] text-[#18E299] dark:bg-[#18E299] dark:text-[#0D0D0D] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} weight="bold" />
            Adicionar assinatura
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((sub) => {
            const recoveredCents = sub.participants.reduce(
              (sum, p) => sum + calculateParticipantShareCents(sub, p),
              0
            );
            const ownerCents = Math.max(0, sub.totalCents - recoveredCents);
            const validMembers = sub.participants
              .map((p) => ({
                member: memberMap.get(p.memberId),
                part: p,
              }))
              .filter((x): x is { member: Member; part: (typeof sub.participants)[number] } =>
                Boolean(x.member)
              );

            return (
              <article
                key={sub.id}
                onClick={() => onEdit(sub)}
                className={`rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3.5 transition-transform active:scale-[0.99] cursor-pointer ${
                  !sub.active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--surface-muted)] text-[var(--text-primary)] inline-flex items-center justify-center shrink-0">
                      <CategoryIcon category={sub.category} size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                          {sub.name}
                        </h3>
                        {!sub.active && (
                          <span className="font-mono-tech text-[10px] uppercase px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-tertiary)]">
                            PAUSADA
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-tertiary)]">
                        <span>{CATEGORY_LABELS[sub.category]}</span>
                        <span>·</span>
                        <span className="font-mono-tech inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                          <CalendarBlank size={13} weight="bold" />
                          DIA {String(sub.billingDay).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(sub);
                    }}
                    aria-label={`Editar ${sub.name}`}
                    className="w-8 h-8 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] inline-flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <PencilSimple size={15} weight="bold" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[var(--surface-muted)]/60 px-3 py-2.5">
                  <div>
                    <span className="font-mono-tech text-[10px] uppercase text-[var(--text-tertiary)] block">
                      TOTAL
                    </span>
                    <span className="font-mono-tech text-xs font-semibold text-[var(--text-primary)]">
                      {formatCentsBRL(sub.totalCents)}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono-tech text-[10px] uppercase text-[var(--text-tertiary)] block">
                      FAMÍLIA PAGA
                    </span>
                    <span className="font-mono-tech text-xs font-semibold text-[var(--status-success)]">
                      {formatCentsBRL(recoveredCents)}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono-tech text-[10px] uppercase text-[var(--text-tertiary)] block">
                      SUA PARTE
                    </span>
                    <span className="font-mono-tech text-xs font-semibold text-[var(--text-primary)]">
                      {formatCentsBRL(ownerCents)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  {validMembers.length === 0 ? (
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Toque para adicionar quem divide este plano
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {validMembers.map(({ member, part }) => {
                        const share = calculateParticipantShareCents(sub, part);
                        return (
                          <span
                            key={member.id}
                            className="inline-flex items-center gap-1.5 pr-2.5 pl-1 py-0.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-xs"
                          >
                            <MemberMonogram name={member.name} size="sm" />
                            <span className="font-medium text-[var(--text-primary)]">
                              {member.name.split(" ")[0]}
                            </span>
                            <span className="font-mono-tech text-[10px] text-[var(--text-secondary)]">
                              {part.isExempt ? "Cortesia" : formatCentsBRL(share)}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
