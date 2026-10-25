import { createFileRoute, Link } from "@tanstack/react-router";
import { eventImage, getEvent, placeLine } from "@/data/catalog";
import { formatWhen } from "@/lib/format";
import { sectionName } from "@/lib/offers";
import { useApp, type Order } from "@/lib/store";
import { useT } from "@/components/use-t";
import { btn } from "@/components/cards";

export const Route = createFileRoute("/tickets")({
  component: TicketsPage,
});

function TicketsPage() {
  const { t, lang } = useT();
  const hydrated = useApp((s) => s.hydrated);
  const user = useApp((s) => s.user);
  const orders = useApp((s) => s.orders);
  const openAuth = useApp((s) => s.openAuth);
  if (!hydrated) return <main className="mx-auto max-w-3xl px-4 py-8" />;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">{t("myTickets")}</h1>
        <p className="mt-2 text-muted">{t("ticketsEmpty")}</p>
        <button type="button" className={`${btn} mt-4`} onClick={() => openAuth("in")}>
          {t("signIn")}
        </button>
      </main>
    );
  }
  const mine = orders.filter((o) => o.email === user.email);
  const now = Date.now();
  const up = mine.filter((o) => {
    const ev = getEvent(o.eventId);
    return ev && new Date(ev.date).getTime() + 5 * 3600 * 1000 > now && o.status !== "transferred" && o.status !== "sold";
  });
  const rest = mine.filter((o) => !up.includes(o));
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("myTickets")}</h1>
      <Section title={t("upcoming")} rows={up} lang={lang} empty={t("ticketsEmpty")} t={t} />
      {rest.length ? <Section title={t("past")} rows={rest} lang={lang} empty="" t={t} /> : null}
    </main>
  );
}

function Section({
  title,
  rows,
  lang,
  empty,
  t,
}: {
  title: string;
  rows: Order[];
  lang: "en" | "es";
  empty: string;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold uppercase text-muted">{title}</h2>
      {rows.length === 0 && empty ? <p className="mt-2 text-sm text-muted">{empty}</p> : null}
      <ul className="mt-2 space-y-3">
        {rows.map((o) => {
          const ev = getEvent(o.eventId);
          if (!ev) return null;
          return (
            <li key={o.id}>
              <Link to="/ticket/$orderId" params={{ orderId: o.id }} className="flex gap-3 rounded-xl border border-line p-3 hover:border-blue">
                <img src={eventImage(ev)} alt="" className="h-20 w-20 rounded-md object-cover" />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{ev.title}</span>
                  <span className="block text-sm text-muted">
                    {formatWhen(ev.date, lang, "short")} · {formatWhen(ev.date, lang, "time")} · {placeLine(ev)}
                  </span>
                  <span className="block text-sm">
                    {sectionName(o.section, lang)} · {t("row")} {o.row} · {o.seats.join(", ")}
                  </span>
                  {o.status !== "confirmed" ? <span className="text-xs font-bold uppercase text-gold">{t(o.status === "listed" ? "listed" : o.status === "sold" ? "sold" : "transferred")}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
