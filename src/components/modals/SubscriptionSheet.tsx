"use client";

import React, { useState } from "react";
import {
  Check,
  Gift,
  Plus,
  Trash,
  UserPlus,
} from "@phosphor-icons/react";
import { calculateEqualSlotCents } from "@/lib/billing";
import { CATEGORY_LABELS, SUBSCRIPTION_PRESETS } from "@/lib/presets";
import {
  clampBillingDay,
  formatCentsBRL,
  formatCentsInput,
  parseCurrencyToCents,
  sanitizePhone,
  sanitizeText,
} from "@/lib/sanitize";
import type {
  Member,
  ServiceCategory,
  SplitMode,
  Subscription,
  SubscriptionParticipant,
} from "@/types/cobrar";
import { BottomSheet, CategoryIcon, MemberMonogram } from "@/components/ui/Primitives";

interface SubscriptionSheetProps {
  open: boolean;
  onClose: () => void;
  editing: Subscription | null;
  members: Member[];
  onQuickCreateMember: (data: { name: string; phone: string; relation?: string }) => Member;
  onSave: (data: Omit<Subscription, "id" | "createdAt">, existingId?: string) => void;
  onDelete?: (id: string) => void;
}

const QUICK_DAYS = [1, 5, 10, 15, 20, 25];

function buildInitialSelectedMap(editing: Subscription | null) {
  if (!editing) return {};
  const map: Record<string, { customInput: string; isExempt: boolean }> = {};
  for (const p of editing.participants) {
    map[p.memberId] = {
      customInput: p.customCents ? formatCentsInput(p.customCents) : "",
      isExempt: Boolean(p.isExempt),
    };
  }
  return map;
}

function SubscriptionFormBody({
  editing,
  members,
  onQuickCreateMember,
  onSave,
  onDelete,
  onClose,
}: Omit<SubscriptionSheetProps, "open">) {
  const [name, setName] = useState(() => editing?.name ?? "");
  const [category, setCategory] = useState<ServiceCategory>(
    () => editing?.category ?? "streaming"
  );
  const [priceInput, setPriceInput] = useState(() =>
    editing ? formatCentsInput(editing.totalCents) : ""
  );
  const [billingDay, setBillingDay] = useState(() => editing?.billingDay ?? 10);
  const [includeOwnerSlot, setIncludeOwnerSlot] = useState(
    () => editing?.includeOwnerSlot ?? true
  );
  const [splitMode, setSplitMode] = useState<SplitMode>(
    () => editing?.splitMode ?? "equal"
  );
  const [selectedMap, setSelectedMap] = useState<
    Record<string, { customInput: string; isExempt: boolean }>
  >(() => buildInitialSelectedMap(editing));
  const [active, setActive] = useState(() => editing?.active ?? true);
  const [notes, setNotes] = useState(() => editing?.notes ?? "");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [showQuickMember, setShowQuickMember] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");

  const totalCents = parseCurrencyToCents(priceInput);
  const selectedIds = Object.keys(selectedMap);
  const equalSlotCents = calculateEqualSlotCents(
    totalCents,
    selectedIds.length,
    includeOwnerSlot
  );

  const toggleMember = (memberId: string) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[memberId]) {
        delete next[memberId];
      } else {
        next[memberId] = {
          customInput: equalSlotCents > 0 ? formatCentsInput(equalSlotCents) : "",
          isExempt: false,
        };
      }
      return next;
    });
  };

  const toggleExempt = (memberId: string) => {
    setSelectedMap((prev) => {
      if (!prev[memberId]) return prev;
      return {
        ...prev,
        [memberId]: {
          ...prev[memberId],
          isExempt: !prev[memberId].isExempt,
        },
      };
    });
  };

  const updateCustomInput = (memberId: string, val: string) => {
    setSelectedMap((prev) => {
      if (!prev[memberId]) return prev;
      return {
        ...prev,
        [memberId]: {
          ...prev[memberId],
          customInput: val,
        },
      };
    });
  };

  const handleQuickAddMember = () => {
    const cleanName = sanitizeText(quickName, 80);
    if (!cleanName) return;
    const created = onQuickCreateMember({
      name: cleanName,
      phone: sanitizePhone(quickPhone),
    });
    setSelectedMap((prev) => ({
      ...prev,
      [created.id]: {
        customInput: equalSlotCents > 0 ? formatCentsInput(equalSlotCents) : "",
        isExempt: false,
      },
    }));
    setQuickName("");
    setQuickPhone("");
    setShowQuickMember(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 80);
    if (!cleanName) {
      setError("Informe o nome da assinatura.");
      return;
    }
    if (totalCents <= 0) {
      setError("Informe o valor mensal total da assinatura.");
      return;
    }

    const participants: SubscriptionParticipant[] = selectedIds.map((memberId) => {
      const cfg = selectedMap[memberId];
      return {
        memberId,
        isExempt: cfg.isExempt,
        customCents:
          splitMode === "custom" ? parseCurrencyToCents(cfg.customInput) : undefined,
      };
    });

    onSave(
      {
        name: cleanName,
        category,
        totalCents,
        billingDay: clampBillingDay(billingDay),
        includeOwnerSlot,
        splitMode,
        participants,
        active,
        notes: sanitizeText(notes, 200) || undefined,
      },
      editing?.id
    );
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!editing && (
        <div className="space-y-2">
          <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] block">
            Atalhos rápidos
          </span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {SUBSCRIPTION_PRESETS.map((preset) => {
              const isSelected = name === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setName(preset.name);
                    setCategory(preset.category);
                    setPriceInput(formatCentsInput(preset.suggestedCents));
                    setBillingDay(preset.suggestedDay);
                    setError("");
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? "bg-[#0D0D0D] text-[#18E299] border-[#0D0D0D] dark:bg-[#18E299] dark:text-[#0D0D0D]"
                      : "bg-[var(--surface-muted)] text-[var(--text-primary)] border-[var(--border-subtle)]"
                  }`}
                >
                  <CategoryIcon category={preset.category} size={14} />
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="sm:col-span-3 flex flex-col gap-1.5">
          <label
            htmlFor="sub-name"
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Serviço / Assinatura
          </label>
          <input
            id="sub-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Ex: YouTube Premium Família"
            className="w-full h-11 px-4 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#18E299] focus:ring-2 focus:ring-[#18E299]/25"
          />
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor="sub-cat"
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Categoria
          </label>
          <select
            id="sub-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            className="w-full h-11 px-3.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] focus:outline-none focus:border-[#18E299]"
          >
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="sub-price"
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Valor total mensal (R$)
          </label>
          <input
            id="sub-price"
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(e) => {
              setPriceInput(e.target.value);
              setError("");
            }}
            placeholder="53,90"
            className="font-mono-tech w-full h-11 px-4 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#18E299] focus:ring-2 focus:ring-[#18E299]/25"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="sub-day"
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Dia do vencimento
          </label>
          <input
            id="sub-day"
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            value={billingDay}
            onChange={(e) => setBillingDay(Number(e.target.value))}
            className="font-mono-tech w-full h-11 px-4 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base font-medium text-[var(--text-primary)] focus:outline-none focus:border-[#18E299] focus:ring-2 focus:ring-[#18E299]/25"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mr-1">
          Dia:
        </span>
        {QUICK_DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setBillingDay(d)}
            className={`font-mono-tech px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              billingDay === d
                ? "bg-[#18E299] text-[#0D0D0D] font-semibold"
                : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
            }`}
          >
            {String(d).padStart(2, "0")}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-[var(--surface-muted)]/70 border border-[var(--border-subtle)] p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Modo de divisão
          </span>
          <div className="inline-flex rounded-full bg-[var(--surface-card)] p-0.5 border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setSplitMode("equal")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                splitMode === "equal"
                  ? "bg-[#0D0D0D] text-white dark:bg-[#18E299] dark:text-[#0D0D0D]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Igualitária
            </button>
            <button
              type="button"
              onClick={() => setSplitMode("custom")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                splitMode === "custom"
                  ? "bg-[#0D0D0D] text-white dark:bg-[#18E299] dark:text-[#0D0D0D]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Fixo por pessoa
            </button>
          </div>
        </div>

        {splitMode === "equal" && (
          <label className="flex items-center justify-between gap-3 pt-1 cursor-pointer select-none">
            <div>
              <span className="text-xs font-medium text-[var(--text-primary)] block">
                Incluir minha vaga na conta
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] block">
                Divide o total entre os selecionados + você (
                {selectedIds.length + (includeOwnerSlot ? 1 : 0)}{" "}
                {selectedIds.length + (includeOwnerSlot ? 1 : 0) === 1
                  ? "vaga"
                  : "vagas"}{" "}
                ={" "}
                <strong className="font-mono-tech text-[var(--text-primary)]">
                  {formatCentsBRL(equalSlotCents)}
                </strong>{" "}
                por vaga)
              </span>
            </div>
            <input
              type="checkbox"
              checked={includeOwnerSlot}
              onChange={(e) => setIncludeOwnerSlot(e.target.checked)}
              className="w-5 h-5 accent-[#18E299] rounded shrink-0 cursor-pointer"
            />
          </label>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Quem divide esta assinatura ({selectedIds.length})
          </span>
          <button
            type="button"
            onClick={() => setShowQuickMember((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-deep)] hover:underline cursor-pointer"
          >
            <UserPlus size={15} weight="bold" />
            Nova pessoa
          </button>
        </div>

        {showQuickMember && (
          <div className="rounded-2xl p-3 bg-[var(--brand-soft)] border border-[#0FA76E]/20 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Nome da pessoa"
                className="h-10 px-3.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] focus:outline-none focus:border-[#18E299]"
              />
              <input
                type="tel"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="WhatsApp (opcional)"
                className="h-10 px-3.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] focus:outline-none focus:border-[#18E299]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowQuickMember(false)}
                className="px-3 py-1.5 rounded-full text-xs text-[var(--text-secondary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickAddMember}
                disabled={!quickName.trim()}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0D0D0D] text-[#18E299] disabled:opacity-40 cursor-pointer"
              >
                <Plus size={14} weight="bold" />
                Adicionar na lista
              </button>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-4 text-center">
            <p className="text-xs text-[var(--text-secondary)]">
              Nenhuma pessoa cadastrada ainda. Toque em{" "}
              <button
                type="button"
                onClick={() => setShowQuickMember(true)}
                className="font-semibold text-[var(--brand-deep)] underline cursor-pointer"
              >
                Nova pessoa
              </button>{" "}
              acima para adicionar quem divide com você.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const cfg = selectedMap[member.id];
              const isChecked = Boolean(cfg);
              const memberCents = !isChecked
                ? 0
                : cfg.isExempt
                ? 0
                : splitMode === "custom"
                ? parseCurrencyToCents(cfg.customInput)
                : equalSlotCents;

              return (
                <div
                  key={member.id}
                  className={`rounded-2xl border p-3 transition-colors ${
                    isChecked
                      ? "bg-[var(--surface-card)] border-[#18E299]/60 shadow-[var(--shadow-card)]"
                      : "bg-[var(--surface-muted)]/40 border-[var(--border-subtle)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked
                            ? "bg-[#18E299] border-[#18E299] text-[#0D0D0D]"
                            : "border-[var(--border-strong)] bg-transparent"
                        }`}
                      >
                        {isChecked && <Check size={12} weight="bold" />}
                      </div>
                      <MemberMonogram name={member.name} size="sm" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-[var(--text-primary)] block truncate">
                          {member.name}
                        </span>
                        {member.relation && (
                          <span className="text-[11px] text-[var(--text-tertiary)] block">
                            {member.relation}
                          </span>
                        )}
                      </div>
                    </button>

                    {isChecked && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExempt(member.id)}
                          title="Marcar como cortesia (ocupa vaga mas não paga)"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono-tech uppercase border transition-colors cursor-pointer ${
                            cfg.isExempt
                              ? "bg-[#0D0D0D] text-[#18E299] border-[#0D0D0D]"
                              : "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                          }`}
                        >
                          <Gift size={12} weight="bold" />
                          {cfg.isExempt ? "Cortesia" : "Cobrar"}
                        </button>

                        {splitMode === "custom" && !cfg.isExempt ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={cfg.customInput}
                            onChange={(e) =>
                              updateCustomInput(member.id, e.target.value)
                            }
                            placeholder="15,00"
                            aria-label={`Valor de ${member.name}`}
                            className="font-mono-tech w-24 h-8 px-2.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border-strong)] text-sm text-right text-[var(--text-primary)] focus:outline-none focus:border-[#18E299]"
                          />
                        ) : (
                          <span className="font-mono-tech text-xs font-semibold text-[var(--text-primary)] min-w-[68px] text-right">
                            {cfg.isExempt ? "R$ 0,00" : formatCentsBRL(memberCents)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="sub-notes"
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          Observação opcional (ex: e-mail da conta família)
        </label>
        <input
          id="sub-notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
          className="w-full h-11 px-4 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#18E299]"
        />
      </div>

      {editing && (
        <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Assinatura ativa nas cobranças mensais
          </span>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-5 h-5 accent-[#18E299] cursor-pointer"
          />
        </label>
      )}

      {error && (
        <p
          role="alert"
          className="text-xs font-medium text-[var(--status-error)] bg-[var(--status-error-bg)] px-3.5 py-2.5 rounded-xl"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2.5 pt-2">
        <button
          type="submit"
          className="w-full h-12 rounded-full bg-[#18E299] hover:bg-[#0FA76E] text-[#0D0D0D] font-semibold text-sm tracking-tight transition-all active:scale-[0.98] cursor-pointer"
        >
          {editing ? "Salvar alterações" : "Criar assinatura"}
        </button>

        {editing && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              onDelete(editing.id);
              onClose();
            }}
            className={`w-full h-11 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              confirmDelete
                ? "bg-[var(--status-error)] text-white"
                : "bg-[var(--status-error-bg)] text-[var(--status-error)]"
            }`}
          >
            <Trash size={15} weight="bold" />
            {confirmDelete
              ? "Toque novamente para confirmar exclusão"
              : "Excluir assinatura"}
          </button>
        )}
      </div>
    </form>
  );
}

export function SubscriptionSheet(props: SubscriptionSheetProps) {
  const { open, onClose, editing } = props;
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? "Editar assinatura" : "Nova assinatura"}
      subtitle="Configure o valor, vencimento e quem divide com você"
    >
      {open && (
        <SubscriptionFormBody
          key={editing?.id ?? "new-sub"}
          editing={props.editing}
          members={props.members}
          onQuickCreateMember={props.onQuickCreateMember}
          onSave={props.onSave}
          onDelete={props.onDelete}
          onClose={props.onClose}
        />
      )}
    </BottomSheet>
  );
}
