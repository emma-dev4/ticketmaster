import { createFileRoute, Link } from "@tanstack/react-router";
import { byDate, events, type Category } from "@/data/catalog";
import { isSameDay, isThisMonth, isWeekend, upcoming } from "@/lib/format";
import { useApp } from "@/lib/store";
import { DateRow } from "@/components/cards";
import { useT } from "@/components/use-t";
import { cn } from "@/lib/cn";

const CATS = ["concerts", "sports", "arts", "family"] as const;

export const Route = createFileRoute("/discover/$category")({
  validateSearch: (s: Record<string, unknown>) => ({
    when: s.when === "today" || s.when === "weekend" || s.when === "month" ? s.when : ("all" as const),
  }),
  component: Discover,
});

function Discover() {
  const { category } = Route.useParams();
  const { when } = Route.useSearch();
  const { t } = useT();
  const market = useApp((s) => s.market);
  const city = useApp((s) => s.city);
  const valid = (CATS as readonly string[]).includes(category);
  if (!valid) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-extrabold">{t("categoryMissing")}</h1>
        <Link to="/" className="mt-3 inline-flex font-bold text-blue">
          {t("backHome")}
        </Link>
      </main>
    );
  }
  const cat = category as Category;
  let rows = events.filter((e) => e.market === market && e.category === cat && upcoming(e)).sort(byDate);
  if (when === "today") rows = rows.filter((e) => isSameDay(e.date));
  if (when === "weekend") rows = rows.filter((e) => isWeekend(e.date));
  if (when === "month") rows = rows.filter((e) => isThisMonth(e.date));
  const local = rows.filter((e) => e.metro === city);
  const shown = local.length && when !== "all" ? rows : rows;
  const filters = [
    ["all", t("allDates")],
    ["today", t("today")],
    ["weekend", t("thisWeekend")],
    ["month", t("thisMonth")],
  ] as const;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t(cat === "arts" ? "arts" : cat)}</h1>
      <p className="text-sm text-muted">{t("eventsCount", { n: shown.length })}</p>
      <div className="rail mt-4 flex gap-2 overflow-x-auto">
        {filters.map(([id, label]) => (
          <Link
            key={id}
            to="/discover/$category"
            params={{ category: cat }}
            search={{ when: id }}
            className={cn("inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold", when === id ? "bg-blue text-on-blue" : "bg-surface")}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-4">
        {shown.length === 0 ? <p className="text-muted">{t("noUpcoming")}</p> : shown.map((e) => <DateRow key={e.id} event={e} />)}
      </div>
    </main>
  );
}
