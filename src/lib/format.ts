import type { Currency, EventItem } from "@/data/catalog";

export type Lang = "en" | "es";

export function money(n: number, currency: Currency, lang: Lang) {
  return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatWhen(iso: string, lang: Lang, mode: "long" | "short" | "time" | "month" | "weekday") {
  const d = new Date(iso);
  const loc = lang === "es" ? "es-ES" : "en-US";
  if (mode === "time") return new Intl.DateTimeFormat(loc, { hour: "numeric", minute: "2-digit" }).format(d);
  if (mode === "month") return new Intl.DateTimeFormat(loc, { month: "short" }).format(d).replace(".", "");
  if (mode === "weekday") return new Intl.DateTimeFormat(loc, { weekday: "short" }).format(d).replace(".", "");
  if (mode === "short") return new Intl.DateTimeFormat(loc, { month: "short", day: "numeric" }).format(d);
  return new Intl.DateTimeFormat(loc, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function dayNum(iso: string) {
  return new Date(iso).getDate();
}

export function isSameDay(iso: string, now = new Date()) {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function isTomorrow(iso: string, now = new Date()) {
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  return isSameDay(iso, t);
}

export function weekendBounds(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const dow = start.getDay();
  const sat = new Date(start);
  if (dow === 0) sat.setDate(sat.getDate() - 1);
  else if (dow !== 6) sat.setDate(sat.getDate() + (6 - dow));
  const end = new Date(sat);
  end.setDate(sat.getDate() + 1);
  end.setHours(23, 59, 59, 999);
  return { sat, end };
}

export function isWeekend(iso: string, now = new Date()) {
  const d = new Date(iso);
  const { sat, end } = weekendBounds(now);
  return d >= sat && d <= end;
}

export function isThisMonth(iso: string, now = new Date()) {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function upcoming(e: EventItem, now = new Date()) {
  return new Date(e.date).getTime() + 4 * 60 * 60 * 1000 > now.getTime();
}
