import { describe, expect, it } from "vitest";
import {
  buildWhatsappMessage,
  calculateParticipantShareCents,
  computeMonthlyCharges,
  computeMonthlySummary,
  groupChargesByMember,
} from "@/lib/billing";
import { parseCurrencyToCents, sanitizePhone, toWhatsappNumber } from "@/lib/sanitize";
import { createDefaultSettings, normalizeStore } from "@/lib/storage";
import type { Member, Subscription } from "@/types/cobrar";

describe("Sanitize & Currency Helpers", () => {
  it("converts BRL inputs accurately into integer cents", () => {
    expect(parseCurrencyToCents("53,90")).toBe(5390);
    expect(parseCurrencyToCents("R$ 1.249,50")).toBe(124950);
    expect(parseCurrencyToCents("34.90")).toBe(3490);
    expect(parseCurrencyToCents("")).toBe(0);
  });

  it("normalizes Brazilian phone numbers to WhatsApp international format", () => {
    expect(sanitizePhone("(11) 99876-5432")).toBe("11998765432");
    expect(toWhatsappNumber("(11) 99876-5432")).toBe("5511998765432");
    expect(toWhatsappNumber("5521988887777")).toBe("5521988887777");
  });
});

describe("Billing Split & Monthly Ledger", () => {
  const members: Member[] = [
    { id: "m1", name: "Lucas Andrade", phone: "11999991111", createdAt: "2026-01-01" },
    { id: "m2", name: "Mariana Costa", phone: "11999992222", createdAt: "2026-01-01" },
    { id: "m3", name: "Dona Helena", phone: "11999993333", createdAt: "2026-01-01" },
  ];

  const subEqual: Subscription = {
    id: "s1",
    name: "YouTube Premium Família",
    category: "streaming",
    totalCents: 5390,
    billingDay: 10,
    includeOwnerSlot: true, // 3 membros + 1 titular = 4 vagas -> 1348 centavos cada
    splitMode: "equal",
    participants: [
      { memberId: "m1" },
      { memberId: "m2" },
      { memberId: "m3", isExempt: true }, // Cortesia ocupa vaga mas cobra 0
    ],
    active: true,
    createdAt: "2026-01-01",
  };

  it("splits equally counting owner slot and keeps exempt slot at zero charge", () => {
    expect(calculateParticipantShareCents(subEqual, subEqual.participants[0])).toBe(1348);
    expect(calculateParticipantShareCents(subEqual, subEqual.participants[1])).toBe(1348);
    expect(calculateParticipantShareCents(subEqual, subEqual.participants[2])).toBe(0);
  });

  it("detects overdue, paid, and exempt charges accurately", () => {
    const refNow = new Date(2026, 10, 15, 12, 0, 0); // 15/Nov/2026 (vencimento dia 10 -> atrasado 5 dias)
    const payments = {
      "2026-11::s1::m2": { status: "paid" as const, amountPaidCents: 1348, paidAt: "2026-11-09" },
    };

    const charges = computeMonthlyCharges("2026-11", [subEqual], members, payments, refNow);
    expect(charges).toHaveLength(3);

    const m1Charge = charges.find((c) => c.memberId === "m1")!;
    const m2Charge = charges.find((c) => c.memberId === "m2")!;
    const m3Charge = charges.find((c) => c.memberId === "m3")!;

    expect(m1Charge.urgency).toBe("overdue");
    expect(m1Charge.daysDelta).toBe(-5);
    expect(m2Charge.urgency).toBe("paid");
    expect(m3Charge.urgency).toBe("exempt");

    const summary = computeMonthlySummary("2026-11", [subEqual], charges);
    expect(summary.totalSubscriptionsCostCents).toBe(5390);
    expect(summary.totalReceivableCents).toBe(2696); // m1 + m2
    expect(summary.totalReceivedCents).toBe(1348);
    expect(summary.totalPendingCents).toBe(1348);
    expect(summary.overdueChargesCount).toBe(1);

    const groups = groupChargesByMember(charges, members);
    expect(groups[0].member.id).toBe("m1"); // Atrasado vem primeiro na fila
  });

  it("renders clean pt-BR WhatsApp billing message with PIX key", () => {
    const settings = {
      ...createDefaultSettings(),
      pixKey: "contato@exemplo.com.br",
      pixKeyType: "email" as const,
    };
    const msg = buildWhatsappMessage({
      memberName: "Lucas Andrade",
      yearMonth: "2026-11",
      items: [
        {
          subscriptionName: "YouTube Premium Família",
          amountCents: 1348,
          dueDateFormatted: "10/11",
        },
      ],
      settings,
    });

    expect(msg).toContain("Oi, Lucas!");
    expect(msg).toContain("Novembro 2026");
    expect(msg).toContain("YouTube Premium Família");
    expect(msg).toContain("contato@exemplo.com.br");
  });

  it("sanitizes untrusted JSON backup data safely", () => {
    const dirty = {
      members: [{ id: "m1", name: "<script>Lucas</script>", phone: "(11) 98888-7777" }],
      subscriptions: [
        {
          id: "s1",
          name: "Spotify",
          category: "invalid_cat",
          totalCents: -500,
          billingDay: 99,
          participants: [{ memberId: "m1" }, { memberId: "ghost_member" }],
        },
      ],
    };
    const normalized = normalizeStore(dirty);
    expect(normalized.members[0].name).toBe("scriptLucas/script");
    expect(normalized.subscriptions[0].billingDay).toBe(31);
    expect(normalized.subscriptions[0].totalCents).toBe(0);
    expect(normalized.subscriptions[0].participants).toHaveLength(1);
  });
});
