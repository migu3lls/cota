"use client";

import React from "react";
import {
  PencilSimple,
  Phone,
  UserPlus,
  Users,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { calculateParticipantShareCents } from "@/lib/billing";
import {
  formatCentsBRL,
  formatPhoneDisplay,
  toWhatsappNumber,
} from "@/lib/sanitize";
import type { Member, Subscription } from "@/types/cobrar";
import { MemberMonogram } from "@/components/ui/Primitives";

interface FamilyTabProps {
  members: Member[];
  subscriptions: Subscription[];
  onAdd: () => void;
  onEdit: (member: Member) => void;
}

export function FamilyTab({
  members,
  subscriptions,
  onAdd,
  onEdit,
}: FamilyTabProps) {
  const sorted = [...members].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Família & Grupo
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Pessoas que dividem assinaturas com você ({members.length})
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="h-10 px-4 rounded-full bg-[#18E299] hover:bg-[#0FA76E] text-[#0D0D0D] font-semibold text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95 shrink-0 cursor-pointer"
        >
          <UserPlus size={16} weight="bold" />
          Nova pessoa
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-muted)] text-[var(--text-secondary)] inline-flex items-center justify-center mx-auto">
            <Users size={24} weight="duotone" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Sua família ainda está vazia
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-[30ch] mx-auto leading-relaxed">
              Cadastre familiares ou amigos com o WhatsApp para cobrar em 1 toque todo mês.
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="h-11 px-5 rounded-full bg-[#0D0D0D] text-[#18E299] dark:bg-[#18E299] dark:text-[#0D0D0D] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus size={15} weight="bold" />
            Adicionar primeira pessoa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((member) => {
            const memberSubs = subscriptions
              .filter((s) => s.active)
              .map((s) => {
                const part = s.participants.find((p) => p.memberId === member.id);
                if (!part) return null;
                return {
                  sub: s,
                  part,
                  shareCents: calculateParticipantShareCents(s, part),
                };
              })
              .filter(
                (
                  x
                ): x is {
                  sub: Subscription;
                  part: Subscription["participants"][number];
                  shareCents: number;
                } => Boolean(x)
              );

            const monthlyTotalCents = memberSubs.reduce(
              (sum, x) => sum + x.shareCents,
              0
            );
            const waDigits = toWhatsappNumber(member.phone);

            return (
              <article
                key={member.id}
                onClick={() => onEdit(member)}
                className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 space-y-3 transition-transform active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberMonogram name={member.name} size="lg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                          {member.name}
                        </h3>
                        {member.relation && (
                          <span className="font-mono-tech text-[10px] uppercase px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] shrink-0">
                            {member.relation}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--text-tertiary)]">
                        <Phone size={13} weight="bold" />
                        <span className="font-mono-tech">
                          {member.phone
                            ? formatPhoneDisplay(member.phone)
                            : "Sem WhatsApp cadastrado"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {waDigits && (
                      <a
                        href={`https://wa.me/${waDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Abrir conversa com ${member.name} no WhatsApp`}
                        className="w-9 h-9 rounded-full bg-[#18E299]/18 text-[var(--brand-deep)] inline-flex items-center justify-center active:scale-95"
                      >
                        <WhatsappLogo size={18} weight="fill" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(member);
                      }}
                      aria-label={`Editar ${member.name}`}
                      className="w-9 h-9 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] inline-flex items-center justify-center cursor-pointer"
                    >
                      <PencilSimple size={15} weight="bold" />
                    </button>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5 min-w-0">
                    {memberSubs.length === 0 ? (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        Sem assinaturas vinculadas
                      </span>
                    ) : (
                      memberSubs.map(({ sub, part }) => (
                        <span
                          key={sub.id}
                          className="px-2.5 py-0.5 rounded-full bg-[var(--surface-muted)] text-[11px] font-medium text-[var(--text-secondary)]"
                        >
                          {sub.name}
                          {part.isExempt ? " (Cortesia)" : ""}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono-tech text-sm font-bold text-[var(--text-primary)] block">
                      {formatCentsBRL(monthlyTotalCents)}
                    </span>
                    <span className="font-mono-tech text-[10px] uppercase text-[var(--text-tertiary)] block">
                      POR MÊS
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
