export type ServiceCategory =
  | "streaming"
  | "musica"
  | "nuvem"
  | "produtividade"
  | "jogos"
  | "outros";

export type SplitMode = "equal" | "custom";

export type PixKeyType = "cpf" | "celular" | "email" | "aleatoria";

export type AppTab = "cobrar" | "assinaturas" | "familia" | "ajustes";

export interface Member {
  id: string;
  name: string;
  phone: string; // Apenas digitos (ex: 5511998765432 ou 11998765432)
  relation?: string; // Ex: Irmao, Mae, Primo, Amigo
  createdAt: string;
}

export interface SubscriptionParticipant {
  memberId: string;
  customCents?: number;
  isExempt?: boolean; // Ocupa vaga no plano familia mas nao paga (cortesia)
}

export interface Subscription {
  id: string;
  name: string;
  category: ServiceCategory;
  totalCents: number; // Valor mensal total em centavos inteiros
  billingDay: number; // 1 a 31
  includeOwnerSlot: boolean; // Se true, o titular conta como +1 vaga na divisao igualitaria
  splitMode: SplitMode;
  participants: SubscriptionParticipant[];
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface PaymentEntry {
  status: "paid" | "pending";
  amountPaidCents?: number;
  paidAt?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  remindDaysBefore: number; // 0 = no dia, 1 = 1 dia antes, 2 = 2 dias antes, 3 = 3 dias antes
  remindOverdue: boolean;
  lastNotifiedDate?: string; // YYYY-MM-DD
}

export interface AppSettings {
  ownerName: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  whatsappTemplate: string;
  theme: "light" | "dark";
  notifications: NotificationSettings;
}

export interface CobrarStoreV1 {
  version: 1;
  updatedAt: string;
  members: Member[];
  subscriptions: Subscription[];
  payments: Record<string, PaymentEntry>; // Chave: YYYY-MM::subscriptionId::memberId
  settings: AppSettings;
}

export type ChargeUrgency = "paid" | "overdue" | "today" | "soon" | "upcoming" | "exempt";

export interface ComputedChargeItem {
  cycleKey: string;
  yearMonth: string;
  subscriptionId: string;
  subscriptionName: string;
  category: ServiceCategory;
  billingDay: number;
  dueDateFormatted: string; // Ex: 05/11
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberRelation?: string;
  amountCents: number;
  isPaid: boolean;
  paidAt?: string;
  isExempt: boolean;
  urgency: ChargeUrgency;
  daysDelta: number; // Negativo = atrasado ha X dias, 0 = hoje, positivo = faltam X dias
}

export interface MemberMonthlyGroup {
  member: Member;
  items: ComputedChargeItem[];
  billableItems: ComputedChargeItem[];
  totalBillableCents: number;
  paidCents: number;
  pendingCents: number;
  allPaid: boolean;
  worstUrgency: ChargeUrgency;
}

export interface MonthlySummary {
  yearMonth: string;
  totalSubscriptionsCostCents: number; // Soma de todas as assinaturas ativas
  totalReceivableCents: number; // Soma do que a familia deve pagar no mes
  totalReceivedCents: number; // Quanto ja pagaram no mes
  totalPendingCents: number; // Quanto falta cair no PIX
  ownerNetCostCents: number; // Quanto realmente sai do seu bolso
  totalChargesCount: number;
  paidChargesCount: number;
  overdueChargesCount: number;
  dueTodayChargesCount: number;
  dueSoonChargesCount: number;
}
