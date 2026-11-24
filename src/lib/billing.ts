import { formatCentsBRL, toWhatsappNumber } from "@/lib/sanitize";
import type {
  AppSettings,
  ChargeUrgency,
  ComputedChargeItem,
  Member,
  MemberMonthlyGroup,
  MonthlySummary,
  PaymentEntry,
  Subscription,
  SubscriptionParticipant,
} from "@/types/cobrar";

const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MONTH_NAMES_ACCENTED_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function getCurrentYearMonth(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const [yStr, mStr] = yearMonth.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const date = new Date(y, m - 1 + deltaMonths, 1);
  return getCurrentYearMonth(date);
}

export function formatYearMonthLabel(yearMonth: string, short = false): string {
  const [yStr, mStr] = yearMonth.split("-");
  const monthIdx = Math.max(0, Math.min(11, Number(mStr) - 1));
  const fullName = MONTH_NAMES_ACCENTED_PT[monthIdx] || MONTH_NAMES_PT[monthIdx];
  if (short) {
    return `${fullName.slice(0, 3)} ${yStr}`;
  }
  return `${fullName} ${yStr}`;
}

export function getDaysInMonth(year: number, month1Based: number): number {
  return new Date(year, month1Based, 0).getDate();
}

export function buildCycleKey(
  yearMonth: string,
  subscriptionId: string,
  memberId: string
): string {
  return `${yearMonth}::${subscriptionId}::${memberId}`;
}

/**
 * Calcula o valor em centavos que um participante especifico paga na assinatura.
 * Se for cortesia (isExempt), retorna 0 (mas ocupa vaga no divisor do plano familia).
 */
export function calculateParticipantShareCents(
  subscription: Subscription,
  participant: SubscriptionParticipant
): number {
  if (participant.isExempt) {
    return 0;
  }
  if (subscription.splitMode === "custom") {
    return Math.max(0, Math.round(participant.customCents ?? 0));
  }
  const memberSlots = subscription.participants.length;
  const totalSlots = memberSlots + (subscription.includeOwnerSlot ? 1 : 0);
  if (totalSlots <= 0) return 0;
  return Math.round(subscription.totalCents / totalSlots);
}

/**
 * Calcula o valor base por vaga em modo igualitario (para exibicao no formulario).
 */
export function calculateEqualSlotCents(
  totalCents: number,
  participantsCount: number,
  includeOwnerSlot: boolean
): number {
  const slots = participantsCount + (includeOwnerSlot ? 1 : 0);
  if (slots <= 0) return totalCents;
  return Math.round(totalCents / slots);
}

export function computeUrgency(
  yearMonth: string,
  billingDay: number,
  isPaid: boolean,
  isExempt: boolean,
  now: Date = new Date()
): { urgency: ChargeUrgency; daysDelta: number; dueDateFormatted: string } {
  const [yStr, mStr] = yearMonth.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const maxDay = getDaysInMonth(year, month);
  const effectiveDay = Math.min(Math.max(1, billingDay), maxDay);
  const dueDateFormatted = `${String(effectiveDay).padStart(2, "0")}/${String(month).padStart(2, "0")}`;

  const dueMidnight = new Date(year, month - 1, effectiveDay, 0, 0, 0, 0);
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  const diffMs = dueMidnight.getTime() - todayMidnight.getTime();
  const daysDelta = Math.round(diffMs / 86_400_000);

  if (isExempt) {
    return { urgency: "exempt", daysDelta, dueDateFormatted };
  }
  if (isPaid) {
    return { urgency: "paid", daysDelta, dueDateFormatted };
  }
  if (daysDelta < 0) {
    return { urgency: "overdue", daysDelta, dueDateFormatted };
  }
  if (daysDelta === 0) {
    return { urgency: "today", daysDelta: 0, dueDateFormatted };
  }
  if (daysDelta <= 3) {
    return { urgency: "soon", daysDelta, dueDateFormatted };
  }
  return { urgency: "upcoming", daysDelta, dueDateFormatted };
}

const URGENCY_PRIORITY: Record<ChargeUrgency, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  upcoming: 3,
  paid: 4,
  exempt: 5,
};

export function computeMonthlyCharges(
  yearMonth: string,
  subscriptions: Subscription[],
  members: Member[],
  payments: Record<string, PaymentEntry>,
  now: Date = new Date()
): ComputedChargeItem[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const items: ComputedChargeItem[] = [];

  for (const sub of subscriptions) {
    if (!sub.active) continue;

    for (const part of sub.participants) {
      const member = memberMap.get(part.memberId);
      if (!member) continue;

      const cycleKey = buildCycleKey(yearMonth, sub.id, member.id);
      const payment = payments[cycleKey];
      const isExempt = Boolean(part.isExempt);
      const isPaid = !isExempt && payment?.status === "paid";

      const baseAmount = calculateParticipantShareCents(sub, part);
      const amountCents =
        isPaid && typeof payment?.amountPaidCents === "number"
          ? payment.amountPaidCents
          : baseAmount;

      const { urgency, daysDelta, dueDateFormatted } = computeUrgency(
        yearMonth,
        sub.billingDay,
        isPaid,
        isExempt,
        now
      );

      items.push({
        cycleKey,
        yearMonth,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        category: sub.category,
        billingDay: sub.billingDay,
        dueDateFormatted,
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        memberRelation: member.relation,
        amountCents,
        isPaid,
        paidAt: payment?.paidAt,
        isExempt,
        urgency,
        daysDelta,
      });
    }
  }

  return items.sort((a, b) => {
    const prioDiff = URGENCY_PRIORITY[a.urgency] - URGENCY_PRIORITY[b.urgency];
    if (prioDiff !== 0) return prioDiff;
    if (a.billingDay !== b.billingDay) return a.billingDay - b.billingDay;
    return a.memberName.localeCompare(b.memberName, "pt-BR");
  });
}

export function groupChargesByMember(
  charges: ComputedChargeItem[],
  members: Member[]
): MemberMonthlyGroup[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const grouped = new Map<string, ComputedChargeItem[]>();

  for (const item of charges) {
    const list = grouped.get(item.memberId) ?? [];
    list.push(item);
    grouped.set(item.memberId, list);
  }

  const groups: MemberMonthlyGroup[] = [];

  for (const [memberId, items] of grouped.entries()) {
    const member = memberMap.get(memberId);
    if (!member) continue;

    const billableItems = items.filter((i) => !i.isExempt && i.amountCents > 0);
    const totalBillableCents = billableItems.reduce((acc, i) => acc + i.amountCents, 0);
    const paidCents = billableItems
      .filter((i) => i.isPaid)
      .reduce((acc, i) => acc + i.amountCents, 0);
    const pendingCents = Math.max(0, totalBillableCents - paidCents);
    const allPaid = billableItems.length > 0 && pendingCents === 0;

    let worstUrgency: ChargeUrgency = billableItems.length === 0 ? "exempt" : "paid";
    for (const item of billableItems) {
      if (URGENCY_PRIORITY[item.urgency] < URGENCY_PRIORITY[worstUrgency]) {
        worstUrgency = item.urgency;
      }
    }

    groups.push({
      member,
      items,
      billableItems,
      totalBillableCents,
      paidCents,
      pendingCents,
      allPaid,
      worstUrgency,
    });
  }

  return groups.sort((a, b) => {
    const prioDiff =
      URGENCY_PRIORITY[a.worstUrgency] - URGENCY_PRIORITY[b.worstUrgency];
    if (prioDiff !== 0) return prioDiff;
    if (b.pendingCents !== a.pendingCents) return b.pendingCents - a.pendingCents;
    return a.member.name.localeCompare(b.member.name, "pt-BR");
  });
}

export function computeMonthlySummary(
  yearMonth: string,
  subscriptions: Subscription[],
  charges: ComputedChargeItem[]
): MonthlySummary {
  const activeSubs = subscriptions.filter((s) => s.active);
  const totalSubscriptionsCostCents = activeSubs.reduce(
    (sum, s) => sum + s.totalCents,
    0
  );

  const billable = charges.filter((c) => !c.isExempt && c.amountCents > 0);
  const totalReceivableCents = billable.reduce((sum, c) => sum + c.amountCents, 0);
  const totalReceivedCents = billable
    .filter((c) => c.isPaid)
    .reduce((sum, c) => sum + c.amountCents, 0);
  const totalPendingCents = Math.max(0, totalReceivableCents - totalReceivedCents);
  const ownerNetCostCents = Math.max(
    0,
    totalSubscriptionsCostCents - totalReceivableCents
  );

  return {
    yearMonth,
    totalSubscriptionsCostCents,
    totalReceivableCents,
    totalReceivedCents,
    totalPendingCents,
    ownerNetCostCents,
    totalChargesCount: billable.length,
    paidChargesCount: billable.filter((c) => c.isPaid).length,
    overdueChargesCount: billable.filter((c) => c.urgency === "overdue").length,
    dueTodayChargesCount: billable.filter((c) => c.urgency === "today").length,
    dueSoonChargesCount: billable.filter((c) => c.urgency === "soon").length,
  };
}

export function formatUrgencyLabel(item: Pick<ComputedChargeItem, "urgency" | "daysDelta" | "dueDateFormatted">): string {
  switch (item.urgency) {
    case "exempt":
      return "CORTESIA";
    case "paid":
      return "PAGO";
    case "today":
      return "VENCE HOJE";
    case "overdue": {
      const days = Math.abs(item.daysDelta);
      return days === 1 ? "ATRASADO 1D" : `ATRASADO ${days}D`;
    }
    case "soon":
      return item.daysDelta === 1 ? "VENCE AMANHÃ" : `EM ${item.daysDelta} DIAS`;
    case "upcoming":
      return `DIA ${item.dueDateFormatted.slice(0, 2)}`;
  }
}

export function buildWhatsappMessage(params: {
  memberName: string;
  yearMonth: string;
  items: Pick<ComputedChargeItem, "subscriptionName" | "amountCents" | "dueDateFormatted">[];
  settings: AppSettings;
}): string {
  const { memberName, yearMonth, items, settings } = params;
  const firstName = memberName.trim().split(/\s+/)[0] || memberName;
  const mesLabel = formatYearMonthLabel(yearMonth);
  const totalCents = items.reduce((acc, i) => acc + i.amountCents, 0);
  const totalStr = formatCentsBRL(totalCents);

  const itemsLines = items
    .map(
      (i) =>
        `- ${i.subscriptionName}: ${formatCentsBRL(i.amountCents)} (venc. ${i.dueDateFormatted})`
    )
    .join("\n");

  const pixLine = settings.pixKey.trim()
    ? `Chave PIX (${settings.pixKeyType.toUpperCase()}): ${settings.pixKey.trim()}`
    : "";

  const template = settings.whatsappTemplate.trim();
  const rendered = template
    .replace(/\{nome\}/gi, firstName)
    .replace(/\{mes\}/gi, mesLabel)
    .replace(/\{itens\}/gi, itemsLines)
    .replace(/\{total\}/gi, totalStr)
    .replace(/\{pix\}/gi, pixLine)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return rendered;
}

export function buildWhatsappUrl(phoneDigits: string, message: string): string | null {
  const waNumber = toWhatsappNumber(phoneDigits);
  if (!waNumber) return null;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}
