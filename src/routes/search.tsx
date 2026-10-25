import { createFileRoute, Link } from "@tanstack/react-router";
import { artistBy, byDate, events, type Market } from "@/data/catalog";
import { useApp } from "@/lib/store";
import { DateRow } from "@/components/cards";
import { useT } from "@/components/use-t";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    where: s.where === "us" || s.where === "es" || s.where === "all" ? s.where : ("market" as const),
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, where } = Route.useSearch();
  const { t } = useT();
  const market = useApp((s) => s.market);
  const scope: Market | "all" = where === "us" || where === "es" || where === "all" ? where : market;
  const query = q.trim().toLowerCase();
  const rows = events
    .filter((e) => {
      if (scope !== "all" && e.market !== scope) return false;
      if (!query) return true;
      const a = artistBy(e.artist);
      return `${e.title} ${e.sub ?? ""} ${e.venue} ${e.city} ${e.region} ${a?.name ?? ""} ${a?.genreEn ?? ""} ${a?.genreEs ?? ""}`.toLowerCase().includes(query);
    })
    .sort(byDate);
  const chips = [
    ["market", scope === market ? (market === "us" ? t("marketUs") : t("marketEs")) : t("where")],
    ["us", t("marketUs")],
    ["es", t("marketEs")],
    ["all", t("marketAll")],
  ] as const;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{query ? t("resultsFor", { q }) : t("seeAll")}</h1>
      <p className="text-sm text-muted">{t("eventsCount", { n: rows.length })}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.slice(1).map(([id, label]) => (
          <Link
            key={id}
            to="/search"
            search={{ q, where: id }}
            className={cn("inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold", (where === id || (where === "market" && id === market)) ? "bg-blue text-on-blue" : "bg-surface")}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-4">{rows.length === 0 ? <p className="text-muted">{t("noResults")}</p> : rows.map((e) => <DateRow key={e.id} event={e} />)}</div>
    </main>
  );
}
