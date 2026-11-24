import { computeMonthlyCharges, getCurrentYearMonth } from "@/lib/billing";
import { formatCentsBRL } from "@/lib/sanitize";
import type { CobrarStoreV1 } from "@/types/cobrar";

export type BrowserNotificationSupport =
  | "unsupported"
  | "ios-needs-install"
  | "default"
  | "granted"
  | "denied";

export function detectNotificationSupport(): BrowserNotificationSupport {
  if (typeof window === "undefined") return "unsupported";

  const ua = window.navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);

  if (!("Notification" in window)) {
    if (isIOS && !isStandalone) {
      return "ios-needs-install";
    }
    return "unsupported";
  }

  return window.Notification.permission;
}

export async function registerCobrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch {
    return null;
  }
}

export async function requestDeviceNotificationPermission(): Promise<BrowserNotificationSupport> {
  const current = detectNotificationSupport();
  if (current === "unsupported" || current === "ios-needs-install") {
    return current;
  }
  try {
    const result = await window.Notification.requestPermission();
    return result;
  } catch {
    return detectNotificationSupport();
  }
}

export async function dispatchLocalNotification(
  title: string,
  body: string,
  tag = "cobrar-lembrete"
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (window.Notification.permission !== "granted") {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: "/icons/pwa-192.png",
    badge: "/icons/pwa-192.png",
    tag,
    data: { url: "/?tab=cobrar" },
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
    new window.Notification(title, options);
    return true;
  } catch {
    try {
      new window.Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

export function getLocalDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Avalia se ha cobrancas hoje, proximas ou atrasadas no mes atual e dispara
 * no maximo 1 notificacao consolidada por dia quando autorizado.
 */
export async function checkAndTriggerDailyReminder(
  store: CobrarStoreV1,
  now: Date = new Date()
): Promise<string | null> {
  const { notifications } = store.settings;
  if (!notifications.enabled) return null;
  if (detectNotificationSupport() !== "granted") return null;

  const todayKey = getLocalDateKey(now);
  if (notifications.lastNotifiedDate === todayKey) {
    return null;
  }

  const ym = getCurrentYearMonth(now);
  const charges = computeMonthlyCharges(
    ym,
    store.subscriptions,
    store.members,
    store.payments,
    now
  ).filter((c) => !c.isExempt && !c.isPaid && c.amountCents > 0);

  if (charges.length === 0) return null;

  const dueToday = charges.filter((c) => c.daysDelta === 0);
  const dueWindow = charges.filter(
    (c) =>
      notifications.remindDaysBefore > 0 &&
      c.daysDelta > 0 &&
      c.daysDelta <= notifications.remindDaysBefore
  );
  const overdue = notifications.remindOverdue
    ? charges.filter((c) => c.daysDelta < 0)
    : [];

  const actionable = [...dueToday, ...overdue, ...dueWindow];
  if (actionable.length === 0) return null;

  const totalPendingCents = actionable.reduce((acc, c) => acc + c.amountCents, 0);
  const uniqueNames = Array.from(
    new Set(actionable.map((c) => c.memberName.split(/\s+/)[0]))
  );
  const namesPreview =
    uniqueNames.length <= 3
      ? uniqueNames.join(", ")
      : `${uniqueNames.slice(0, 3).join(", ")} e +${uniqueNames.length - 3}`;

  let title = "Hora de cobrar sua família";
  if (dueToday.length > 0) {
    title =
      dueToday.length === 1
        ? `Vence hoje: ${dueToday[0].subscriptionName}`
        : `${dueToday.length} cobranças vencem hoje`;
  } else if (overdue.length > 0) {
    title =
      overdue.length === 1
        ? "1 cobrança em atraso no mês"
        : `${overdue.length} cobranças em atraso no mês`;
  } else if (dueWindow.length > 0) {
    title = "Assinaturas vencendo nos próximos dias";
  }

  const body = `${formatCentsBRL(totalPendingCents)} pendente com ${namesPreview}. Toque para enviar no WhatsApp.`;

  const sent = await dispatchLocalNotification(title, body, `cobrar-${todayKey}`);
  return sent ? todayKey : null;
}
