import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { eventImage, placeLine, salePhase, type EventItem } from "@/data/catalog";
import { dayNum, formatWhen, isSameDay, isTomorrow, money } from "@/lib/format";
import { fromPrice } from "@/lib/offers";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/cn";
import { useT } from "@/components/use-t";

export function whenLabel(iso: string, lang: "en" | "es", hydrated: boolean, t: (k: string) => string) {
  if (!hydrated) return formatWhen(iso, lang, "weekday");
  if (isSameDay(iso)) return t("today");
  if (isTomorrow(iso)) return t("tomorrow");
  return formatWhen(iso, lang, "weekday");
}

export function EventCard({ event }: { event: EventItem }) {
  const { t, lang } = useT();
  const hydrated = useApp((s) => s.hydrated);
  const watched = useApp((s) => s.watch.includes(event.id));
  const unlocked = useApp((s) => s.unlocked);
  const toggle = useApp((s) => s.toggleWatch);
  const on = hydrated && watched;
  const phase = salePhase(event, unlocked);
  const price = fromPrice(event);
  return (
    <article className="group relative w-56 shrink-0 sm:w-64">
      <Link to="/event/$eventId" params={{ eventId: event.id }} className="block">
        <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-surface">
          <img src={eventImage(event)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          <div className="absolute left-2 top-2 rounded-md bg-bg/95 px-2 py-1 text-center leading-none">
            <div className="text-xs font-bold uppercase text-muted">{formatWhen(event.date, lang, "month")}</div>
            <div className="text-lg font-extrabold">{dayNum(event.date)}</div>
          </div>
          {event.hot ? (
            <span className="absolute bottom-2 left-2 rounded bg-fg px-1.5 py-0.5 text-xs font-bold uppercase text-bg">{t("highDemand")}</span>
          ) : null}
          {phase !== "open" ? (
            <span className="absolute bottom-2 right-12 rounded bg-gold-bg px-1.5 py-0.5 text-xs font-bold uppercase text-gold">{t("presale")}</span>
          ) : null}
        </div>
        <h3 className="mt-2 truncate text-base font-bold">{event.title}</h3>
        {event.sub ? <p className="truncate text-sm text-muted">{event.sub}</p> : null}
        <p className="truncate text-sm text-muted">
          {event.venue} · {placeLine(event)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {whenLabel(event.date, lang, hydrated, t)} · {formatWhen(event.date, lang, "time")}
        </p>
        <p className="text-sm font-bold">
          {t("from")} {money(price, event.currency, lang)}
        </p>
      </Link>
      <button
        type="button"
        aria-pressed={on}
        aria-label={t("watchlist")}
        className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-bg/90"
        onClick={() => {
          const added = toggle(event.id);
          toast(added ? t("addedWatch") : t("removedWatch"));
        }}
      >
        <Heart className={cn("h-5 w-5", on ? "fill-heart text-heart" : "text-fg")} />
      </button>
    </article>
  );
}

export function Rail({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
          {sub ? <p className="text-sm text-muted">{sub}</p> : null}
        </div>
        {action}
      </div>
      <div className="rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">{children}</div>
    </section>
  );
}

export function DateRow({ event }: { event: EventItem }) {
  const { t, lang } = useT();
  const hydrated = useApp((s) => s.hydrated);
  const unlocked = useApp((s) => s.unlocked);
  const phase = salePhase(event, unlocked);
  return (
    <Link
      to="/event/$eventId"
      params={{ eventId: event.id }}
      className="flex items-center gap-3 border-b border-line py-3 hover:bg-surface"
    >
      <div className="w-14 shrink-0 text-center leading-none">
        <div className="text-xs font-bold uppercase text-muted">{formatWhen(event.date, lang, "month")}</div>
        <div className="text-2xl font-extrabold">{dayNum(event.date)}</div>
        <div className="mt-1 text-xs capitalize text-subtle">{whenLabel(event.date, lang, hydrated, t)}</div>
      </div>
      <img src={eventImage(event)} alt="" className="hidden h-16 w-16 shrink-0 rounded-md object-cover sm:block" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{formatWhen(event.date, lang, "time")}</p>
        <h3 className="truncate font-bold">{event.title}</h3>
        {event.sub ? <p className="truncate text-sm text-muted">{event.sub}</p> : null}
        <p className="truncate text-sm text-muted">
          {event.venue} · {placeLine(event)}
        </p>
        <p className="text-sm font-semibold">
          {phase === "open" ? (
            <>
              {t("from")} {money(fromPrice(event), event.currency, lang)}{" "}
              <span className="font-normal text-muted">{t("includesFees")}</span>
            </>
          ) : (
            <span className="text-gold">{t("presale")}</span>
          )}
          {event.limited ? <span className="ml-2 font-bold text-danger">{t("limited")}</span> : null}
        </p>
      </div>
      <span className="hidden shrink-0 rounded bg-blue px-3 py-2 text-sm font-bold text-on-blue sm:inline-flex">{t("findTickets")}</span>
    </Link>
  );
}

export const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded bg-blue px-4 text-sm font-bold text-on-blue hover:bg-blue-dark disabled:opacity-50";
export const btnGhost = "inline-flex min-h-11 items-center justify-center gap-2 rounded border border-line bg-bg px-4 text-sm font-semibold hover:bg-surface";
