"use client";

import React, { useState } from "react";
import { Check, Trash } from "@phosphor-icons/react";
import { formatPhoneDisplay, sanitizePhone, sanitizeText } from "@/lib/sanitize";
import type { Member, Subscription } from "@/types/cobrar";
import { BottomSheet, CategoryIcon } from "@/components/ui/Primitives";

interface MemberSheetProps {
  open: boolean;
  onClose: () => void;
  editing: Member | null;
  subscriptions: Subscription[];
  onSave: (
    data: { name: string; phone: string; relation?: string; subscriptionIds: string[] },
    existingId?: string
  ) => void;
  onDelete?: (id: string) => void;
}

const RELATION_CHIPS = ["Irmão", "Irmã", "Mãe", "Pai", "Primo(a)", "Amigo(a)", "Parceiro(a)"];

function MemberFormBody({
  editing,
  subscriptions,
  onSave,
  onDelete,
  onClose,
}: Omit<MemberSheetProps, "open">) {
  const [name, setName] = useState(() => editing?.name ?? "");
  const [phone, setPhone] = useState(() =>
    editing ? formatPhoneDisplay(editing.phone) : ""
  );
  const [relation, setRelation] = useState(() => editing?.relation ?? "");
  const [subIds, setSubIds] = useState<string[]>(() =>
    editing
      ? subscriptions
          .filter((s) => s.participants.some((p) => p.memberId === editing.id))
          .map((s) => s.id)
      : []
  );
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleSub = (id: string) => {
    setSubIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 80);
    if (!cleanName) {
      setError("Informe o nome da pessoa.");
      return;
    }

    onSave(
      {
        name: cleanName,
        phone: sanitizePhone(phone),
        relation: sanitizeText(relation, 40) || undefined,
        subscriptionIds: subIds,
      },
      editing?.id
    );
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="member-name"
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          Nome
        </label>
        <input
          id="member-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="Ex: Lucas Andrade"
          className="w-full h-11 px-4 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#18E299] focus:ring-2 focus:ring-[#18E299]/25"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="member-phone"
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          WhatsApp (DDD + número)
        </label>
        <input
          id="member-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99876-5432"
          className="font-mono-tech w-full h-11 px-4 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#18E299] focus:ring-2 focus:ring-[#18E299]/25"
        />
        <span className="text-[11px] text-[var(--text-tertiary)] px-1">
          Usado apenas no seu aparelho para abrir a conversa direta no WhatsApp.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="member-relation"
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          Parentesco ou grupo (opcional)
        </label>
        <input
          id="member-relation"
          type="text"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="Ex: Irmão, Prima, Trabalho"
          className="w-full h-11 px-4 rounded-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#18E299]"
        />
        <div className="flex gap-1.5 flex-wrap">
          {RELATION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setRelation(chip)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                relation === chip
                  ? "bg-[#0D0D0D] text-[#18E299] dark:bg-[#18E299] dark:text-[#0D0D0D]"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {subscriptions.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[var(--text-primary)] block">
            Assinaturas que participa ({subIds.length})
          </span>
          <div className="space-y-2">
            {subscriptions.map((sub) => {
              const checked = subIds.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => toggleSub(sub.id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                    checked
                      ? "bg-[var(--surface-card)] border-[#18E299]/60"
                      : "bg-[var(--surface-muted)]/40 border-[var(--border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                        checked
                          ? "bg-[#18E299] border-[#18E299] text-[#0D0D0D]"
                          : "border-[var(--border-strong)]"
                      }`}
                    >
                      {checked && <Check size={12} weight="bold" />}
                    </div>
                    <CategoryIcon
                      category={sub.category}
                      size={18}
                      className="text-[var(--text-secondary)] shrink-0"
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {sub.name}
                    </span>
                  </div>
                  <span className="font-mono-tech text-[11px] text-[var(--text-tertiary)] uppercase shrink-0">
                    DIA {String(sub.billingDay).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
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
          {editing ? "Salvar pessoa" : "Adicionar pessoa"}
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
              ? "Toque novamente para remover da família"
              : "Remover pessoa"}
          </button>
        )}
      </div>
    </form>
  );
}

export function MemberSheet(props: MemberSheetProps) {
  const { open, onClose, editing } = props;
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? "Editar pessoa" : "Adicionar à família"}
      subtitle="Cadastre o WhatsApp para enviar a cobrança pronta em 1 toque"
    >
      {open && (
        <MemberFormBody
          key={editing?.id ?? "new-member"}
          editing={props.editing}
          subscriptions={props.subscriptions}
          onSave={props.onSave}
          onDelete={props.onDelete}
          onClose={props.onClose}
        />
      )}
    </BottomSheet>
  );
}
