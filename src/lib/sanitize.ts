/**
 * Sanitizacao defensiva de entradas e backups locais (Padrao 10Ativas V2).
 * Evita injecao de HTML/scripts e normaliza campos de texto, moeda e telefone.
 */

export function sanitizeText(value: unknown, maxLength = 120): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultilineText(value: unknown, maxLength = 800): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\D/g, "").slice(0, 15);
}

export function formatPhoneDisplay(digits: string): string {
  const clean = sanitizePhone(digits);
  if (!clean) return "";
  // Remove DDI 55 se tiver 12 ou 13 digitos para exibir formato BR limpo
  const local =
    (clean.length === 12 || clean.length === 13) && clean.startsWith("55")
      ? clean.slice(2)
      : clean;

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return clean;
}

export function toWhatsappNumber(digits: string): string {
  const clean = sanitizePhone(digits);
  if (!clean) return "";
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
}

export function clampBillingDay(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 10;
  return Math.min(31, Math.max(1, Math.round(num)));
}

export function clampCents(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(100_000_00, Math.round(num)); // Teto seguro R$ 100.000,00
}

/**
 * Converte string digitada pelo usuario (ex: "53,90" ou "53.90" ou "5390") em centavos.
 */
export function parseCurrencyToCents(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const normalized = trimmed
    .replace(/[R$\s]/gi, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return clampCents(Math.round(parsed * 100));
}

export function formatCentsBRL(cents: number): string {
  const safe = Number.isFinite(cents) ? cents : 0;
  return (safe / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCentsInput(cents: number): string {
  if (!cents || cents <= 0) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}
