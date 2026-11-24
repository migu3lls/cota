import { DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/presets";
import {
  clampBillingDay,
  clampCents,
  sanitizeMultilineText,
  sanitizePhone,
  sanitizeText,
} from "@/lib/sanitize";
import type {
  AppSettings,
  CobrarStoreV1,
  Member,
  PaymentEntry,
  PixKeyType,
  ServiceCategory,
  SplitMode,
  Subscription,
  SubscriptionParticipant,
} from "@/types/cobrar";

export const STORAGE_KEY = "cobrar_10a_v1";

const VALID_CATEGORIES: ServiceCategory[] = [
  "streaming",
  "musica",
  "nuvem",
  "produtividade",
  "jogos",
  "outros",
];

const VALID_PIX_TYPES: PixKeyType[] = ["cpf", "celular", "email", "aleatoria"];

export function createDefaultSettings(): AppSettings {
  return {
    ownerName: "",
    pixKey: "",
    pixKeyType: "celular",
    whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
    theme: "light",
    notifications: {
      enabled: false,
      remindDaysBefore: 1,
      remindOverdue: true,
      lastNotifiedDate: undefined,
    },
  };
}

export function createEmptyStore(): CobrarStoreV1 {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    members: [],
    subscriptions: [],
    payments: {},
    settings: createDefaultSettings(),
  };
}

export function normalizeStore(raw: unknown): CobrarStoreV1 {
  const fallback = createEmptyStore();
  if (!raw || typeof raw !== "object") return fallback;

  const obj = raw as Record<string, unknown>;

  const rawMembers = Array.isArray(obj.members) ? obj.members : [];
  const members: Member[] = [];
  const seenMemberIds = new Set<string>();

  for (const item of rawMembers) {
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    const id = sanitizeText(m.id, 64);
    const name = sanitizeText(m.name, 80);
    if (!id || !name || seenMemberIds.has(id)) continue;
    seenMemberIds.add(id);

    members.push({
      id,
      name,
      phone: sanitizePhone(m.phone),
      relation: sanitizeText(m.relation, 40) || undefined,
      createdAt: sanitizeText(m.createdAt, 40) || fallback.updatedAt,
    });
  }

  const rawSubs = Array.isArray(obj.subscriptions) ? obj.subscriptions : [];
  const subscriptions: Subscription[] = [];
  const seenSubIds = new Set<string>();

  for (const item of rawSubs) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const id = sanitizeText(s.id, 64);
    const name = sanitizeText(s.name, 80);
    if (!id || !name || seenSubIds.has(id)) continue;
    seenSubIds.add(id);

    const catRaw = sanitizeText(s.category, 30) as ServiceCategory;
    const category: ServiceCategory = VALID_CATEGORIES.includes(catRaw)
      ? catRaw
      : "outros";

    const splitRaw = sanitizeText(s.splitMode, 20) as SplitMode;
    const splitMode: SplitMode = splitRaw === "custom" ? "custom" : "equal";

    const rawParts = Array.isArray(s.participants) ? s.participants : [];
    const participants: SubscriptionParticipant[] = [];
    const seenPartIds = new Set<string>();

    for (const pItem of rawParts) {
      if (!pItem || typeof pItem !== "object") continue;
      const p = pItem as Record<string, unknown>;
      const memberId = sanitizeText(p.memberId, 64);
      if (!memberId || !seenMemberIds.has(memberId) || seenPartIds.has(memberId)) {
        continue;
      }
      seenPartIds.add(memberId);
      participants.push({
        memberId,
        customCents:
          p.customCents !== undefined ? clampCents(p.customCents) : undefined,
        isExempt: Boolean(p.isExempt),
      });
    }

    subscriptions.push({
      id,
      name,
      category,
      totalCents: clampCents(s.totalCents),
      billingDay: clampBillingDay(s.billingDay),
      includeOwnerSlot:
        typeof s.includeOwnerSlot === "boolean" ? s.includeOwnerSlot : true,
      splitMode,
      participants,
      active: typeof s.active === "boolean" ? s.active : true,
      notes: sanitizeText(s.notes, 200) || undefined,
      createdAt: sanitizeText(s.createdAt, 40) || fallback.updatedAt,
    });
  }

  const payments: Record<string, PaymentEntry> = {};
  if (obj.payments && typeof obj.payments === "object") {
    for (const [k, v] of Object.entries(obj.payments as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}::[^:]+::[^:]+$/.test(k)) continue;
      if (!v || typeof v !== "object") continue;
      const entry = v as Record<string, unknown>;
      const status = entry.status === "paid" ? "paid" : "pending";
      payments[k] = {
        status,
        amountPaidCents:
          entry.amountPaidCents !== undefined
            ? clampCents(entry.amountPaidCents)
            : undefined,
        paidAt: sanitizeText(entry.paidAt, 40) || undefined,
      };
    }
  }

  const defaultSettings = createDefaultSettings();
  const rawSettings =
    obj.settings && typeof obj.settings === "object"
      ? (obj.settings as Record<string, unknown>)
      : {};
  const rawNotif =
    rawSettings.notifications && typeof rawSettings.notifications === "object"
      ? (rawSettings.notifications as Record<string, unknown>)
      : {};

  const pixTypeRaw = sanitizeText(rawSettings.pixKeyType, 20) as PixKeyType;
  const pixKeyType: PixKeyType = VALID_PIX_TYPES.includes(pixTypeRaw)
    ? pixTypeRaw
    : "celular";

  const remindDays = Number(rawNotif.remindDaysBefore);
  const safeRemindDays = Number.isFinite(remindDays)
    ? Math.min(7, Math.max(0, Math.round(remindDays)))
    : 1;

  const settings: AppSettings = {
    ownerName: sanitizeText(rawSettings.ownerName, 60),
    pixKey: sanitizeText(rawSettings.pixKey, 140),
    pixKeyType,
    whatsappTemplate:
      sanitizeMultilineText(rawSettings.whatsappTemplate, 800) ||
      defaultSettings.whatsappTemplate,
    theme: rawSettings.theme === "dark" ? "dark" : "light",
    notifications: {
      enabled: Boolean(rawNotif.enabled),
      remindDaysBefore: safeRemindDays,
      remindOverdue:
        typeof rawNotif.remindOverdue === "boolean"
          ? rawNotif.remindOverdue
          : true,
      lastNotifiedDate: sanitizeText(rawNotif.lastNotifiedDate, 20) || undefined,
    },
  };

  return {
    version: 1,
    updatedAt: sanitizeText(obj.updatedAt, 40) || fallback.updatedAt,
    members,
    subscriptions,
    payments,
    settings,
  };
}

export function loadStoreFromLocalStorage(): CobrarStoreV1 {
  if (typeof window === "undefined") {
    return createEmptyStore();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw);
    return normalizeStore(parsed);
  } catch {
    return createEmptyStore();
  }
}

export function saveStoreToLocalStorage(store: CobrarStoreV1): boolean {
  if (typeof window === "undefined") return false;
  try {
    const payload: CobrarStoreV1 = {
      ...store,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function exportStoreAsJsonFile(store: CobrarStoreV1): void {
  if (typeof window === "undefined") return;
  const dateStamp = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify(store, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cota-backup-${dateStamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function generateId(prefix: string): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
    }
  } catch {
    // Fallback para acesso via IP local HTTP sem contexto seguro
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
