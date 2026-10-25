import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { artistBy, byDate, events, getEvent } from "@/data/catalog";
import { useApp } from "@/lib/store";
import { DateRow, btn } from "@/components/cards";
import { useT } from "@/components/use-t";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/watchlist")({
  component: WatchPage,
});

function WatchPage() {
  const { t, lang } = useT();
  const watch = useApp((s) => s.watch);
  const favs = useApp((s) => s.favArtists);
  const [tab, setTab] = useState<"events" | "fav">("events");
  const rows = events.filter((e) => watch.includes(e.id)).sort(byDate);
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("watchlist")}</h1>
      <p className="text-sm text-muted">{t("watchEmpty")}</p>
      <div className="mt-4 grid grid-cols-2 rounded-full bg-surface p-1">
        {(["events", "fav"] as const).map((id) => (
          <button key={id} type="button" className={cn("h-11 rounded-full text-sm font-bold", tab === id ? "bg-blue text-on-blue" : "")} onClick={() => setTab(id)}>
            {id === "events" ? t("eventsTab") : t("favorites")}
          </button>
        ))}
      </div>
      {tab === "events" ? (
        <div className="mt-4">
          {rows.length === 0 ? (
            <Link to="/" className={`${btn} mt-4`}>{t("browse")}</Link>
          ) : (
            rows.map((e) => <DateRow key={e.id} event={e} />)
          )}
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {favs.length === 0 ? <li className="py-6 text-sm text-muted">{t("noFav")}</li> : null}
          {favs.map((slug) => {
            const a = artistBy(slug);
            const next = events.filter((e) => e.artist === slug).sort(byDate)[0];
            const ev = next ?? (getEvent(slug) ? null : null);
            if (!a) return null;
            return (
              <li key={slug}>
                <Link to="/artist/$slug" params={{ slug }} className="flex items-center justify-between py-3">
                  <span>
                    <span className="block font-bold">{a.name}</span>
                    <span className="block text-sm text-muted">{lang === "es" ? a.genreEs : a.genreEn}</span>
                  </span>
                  <span className="text-sm text-blue">{ev ? t("seeListings") : t("artistEvents")}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
