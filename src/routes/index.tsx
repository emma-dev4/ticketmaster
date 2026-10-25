import { createFileRoute, Link } from "@tanstack/react-router";
import { byDate, events, guides, trending, type Category } from "@/data/catalog";
import { isWeekend, upcoming } from "@/lib/format";
import { useApp } from "@/lib/store";
import { EventCard, Rail } from "@/components/cards";
import { useT } from "@/components/use-t";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t, lang } = useT();
  const market = useApp((s) => s.market);
  const city = useApp((s) => s.city);
  const mine = events.filter((e) => e.market === market).sort(byDate);
  const soon = mine.filter((e) => upcoming(e));
  const source = soon.length ? soon : mine;
  const highlights = [...source.filter((e) => e.hot), ...source].filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i).slice(0, 10);
  const weekend = mine.filter((e) => upcoming(e) && isWeekend(e.date));
  const presales = mine.filter((e) => e.presaleStart);
  const inCity = mine.some((e) => e.metro === city);
  const near = (cat: Category) => {
    const local = mine.filter((e) => e.category === cat && e.metro === city);
    return (local.length ? local : mine.filter((e) => e.category === cat)).slice(0, 8);
  };
  const otherMarket = market === "us" ? "es" : "us";
  const otherAll = events.filter((e) => e.market === otherMarket).sort(byDate);
  const otherSoon = otherAll.filter((e) => upcoming(e));
  const other = (otherSoon.length ? otherSoon : otherAll).slice(0, 8);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12">
      <Rail
        title={t("highlights")}
        action={
          <Link to="/discover/$category" params={{ category: "concerts" }} search={{ when: "all" }} className="text-sm font-bold text-blue">
            {t("seeAll")}
          </Link>
        }
      >
        {highlights.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </Rail>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold tracking-tight">{t("trending")}</h2>
        <div className="rail -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {trending[market].map((term) => (
            <Link key={term} to="/search" search={{ q: term, where: market }} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-4 text-sm font-semibold hover:border-blue">
              {term}
            </Link>
          ))}
        </div>
      </section>

      <Rail
        title={t("weekend")}
        sub={t("weekendSub")}
        action={
          <Link to="/discover/$category" params={{ category: "concerts" }} search={{ when: "weekend" }} className="text-sm font-bold text-blue">
            {t("seeAll")}
          </Link>
        }
      >
        {(weekend.length ? weekend : mine.slice(0, 8)).map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </Rail>

      {presales.length ? (
        <Rail title={t("presales")} sub={t("presalesSub")}>
          {presales.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </Rail>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("near", { city })}</h2>
        {!inCity ? <p className="mt-1 text-sm text-muted">{t("nearEmpty", { city })}</p> : null}
        {(
          [
            ["concerts", "concerts"],
            ["sports", "sports"],
            ["arts", "arts"],
            ["family", "family"],
          ] as const
        ).map(([cat, key]) => {
          const rows = near(cat);
          if (!rows.length) return null;
          return (
            <Rail
              key={cat}
              title={t(key)}
              action={
                <Link to="/discover/$category" params={{ category: cat }} search={{ when: "all" }} className="text-sm font-bold text-blue">
                  {t("seeAll")}
                </Link>
              }
            >
              {rows.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </Rail>
          );
        })}
      </section>

      <Rail title={market === "us" ? t("alsoSpain") : t("alsoUs")}>
        {other.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </Rail>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("guides")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <Link key={g.slug} to="/guide/$slug" params={{ slug: g.slug }} className="rounded-xl border border-line p-4 hover:border-blue">
              <h3 className="font-bold">{lang === "es" ? g.titleEs : g.titleEn}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{(lang === "es" ? g.bodyEs : g.bodyEn).split("\n")[0]}</p>
              <p className="mt-3 text-sm font-bold text-blue">{t("read")}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-8 text-xs text-subtle">
        {market === "us" ? "United States" : "España"} · {city}
      </p>
    </main>
  );
}
