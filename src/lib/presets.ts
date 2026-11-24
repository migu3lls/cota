import type { CobrarStoreV1, Member, ServiceCategory, Subscription } from "@/types/cobrar";

export interface SubscriptionPreset {
  name: string;
  category: ServiceCategory;
  suggestedCents: number;
  suggestedDay: number;
}

export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { name: "YouTube Premium Família", category: "streaming", suggestedCents: 5390, suggestedDay: 5 },
  { name: "Spotify Família", category: "musica", suggestedCents: 3490, suggestedDay: 10 },
  { name: "Netflix Premium", category: "streaming", suggestedCents: 5990, suggestedDay: 15 },
  { name: "iCloud+ 2TB", category: "nuvem", suggestedCents: 4990, suggestedDay: 8 },
  { name: "Apple One Família", category: "outros", suggestedCents: 6490, suggestedDay: 12 },
  { name: "Max Platinum", category: "streaming", suggestedCents: 5590, suggestedDay: 20 },
  { name: "Microsoft 365 Family", category: "produtividade", suggestedCents: 4500, suggestedDay: 25 },
  { name: "Nintendo Switch Online Família", category: "jogos", suggestedCents: 1790, suggestedDay: 18 },
  { name: "Canva Equipes", category: "produtividade", suggestedCents: 4490, suggestedDay: 7 },
  { name: "Globoplay + Canais", category: "streaming", suggestedCents: 5490, suggestedDay: 22 },
];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  streaming: "Vídeo & Streaming",
  musica: "Música & Áudio",
  nuvem: "Nuvem & Backup",
  produtividade: "Apps & Trabalho",
  jogos: "Jogos",
  outros: "Outros",
};

export const DEFAULT_WHATSAPP_TEMPLATE = `Oi, {nome}! Tudo bem?
Passando para lembrar da nossa divisão de {mes}:

{itens}

Total: *{total}*
{pix}`;

export function createSampleDataset(now: Date = new Date()): Pick<
  CobrarStoreV1,
  "members" | "subscriptions" | "payments"
> {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const ym = `${year}-${month}`;
  const today = now.getDate();

  const overdueDay = Math.max(1, today > 3 ? today - 3 : 1);
  const todayDay = today;
  const upcomingDay = Math.min(28, today < 26 ? today + 2 : 28);

  const isoNow = now.toISOString();

  const members: Member[] = [
    {
      id: "mem_lucas",
      name: "Lucas Andrade",
      phone: "11994827163",
      relation: "Irmão",
      createdAt: isoNow,
    },
    {
      id: "mem_mariana",
      name: "Mariana Costa",
      phone: "11987316420",
      relation: "Prima",
      createdAt: isoNow,
    },
    {
      id: "mem_rafael",
      name: "Rafael Mendes",
      phone: "21996148205",
      relation: "Amigo",
      createdAt: isoNow,
    },
    {
      id: "mem_helena",
      name: "Dona Helena",
      phone: "11991045582",
      relation: "Mãe",
      createdAt: isoNow,
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: "sub_yt",
      name: "YouTube Premium Família",
      category: "streaming",
      totalCents: 5390,
      billingDay: overdueDay,
      includeOwnerSlot: true,
      splitMode: "equal",
      participants: [
        { memberId: "mem_lucas" },
        { memberId: "mem_mariana" },
        { memberId: "mem_rafael" },
        { memberId: "mem_helena", isExempt: true },
      ],
      active: true,
      notes: "Plano com 5 vagas totais",
      createdAt: isoNow,
    },
    {
      id: "sub_spotify",
      name: "Spotify Família",
      category: "musica",
      totalCents: 3490,
      billingDay: todayDay,
      includeOwnerSlot: true,
      splitMode: "equal",
      participants: [
        { memberId: "mem_lucas" },
        { memberId: "mem_mariana" },
        { memberId: "mem_rafael" },
      ],
      active: true,
      createdAt: isoNow,
    },
    {
      id: "sub_icloud",
      name: "iCloud+ 2TB",
      category: "nuvem",
      totalCents: 4990,
      billingDay: upcomingDay,
      includeOwnerSlot: true,
      splitMode: "equal",
      participants: [
        { memberId: "mem_lucas" },
        { memberId: "mem_helena", isExempt: true },
      ],
      active: true,
      createdAt: isoNow,
    },
  ];

  const payments: CobrarStoreV1["payments"] = {
    [`${ym}::sub_yt::mem_mariana`]: {
      status: "paid",
      amountPaidCents: 1078,
      paidAt: isoNow,
    },
  };

  return { members, subscriptions, payments };
}
