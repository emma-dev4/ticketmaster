import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as Slider from "@radix-ui/react-slider";
import { ChevronLeft, Heart, Share2, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { artistBy, events, eventImage, getEvent, placeLine, salePhase, byDate } from "@/data/catalog";
import { formatWhen, money } from "@/lib/format";
import { entryLevel, feesFor, hash, liveOffers, RANK, sectionName, type Offer, type OfferType } from "@/lib/offers";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/cn";
import { SeatMap } from "@/components/seat-map";
import { useT } from "@/components/use-t";
import { btn, btnGhost } from "@/components/cards";

export const Route = createFileRoute("/event/$eventId")({
  component: EventPage,
});

type TypeFilter = "all" | OfferType;

export function EventPage() {
  const { eventId } = Route.useParams();
  const event = getEvent(eventId);
  const { t, lang } = useT();
  if (!event) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">{t("notFound")}</h1>
        <Link to="/" className="mt-4 inline-flex font-bold text-blue">
          {t("backHome")}
        </Link>
      </main>
    );
  }
  return <Shop key={event.id} eventId={event.id} />;
}

function Shop({ eventId }: { eventId: string }) {
  const event = getEvent(eventId)!;
  const { t, lang } = useT();
  const navigate = useNavigate();
  const unlocked = useApp((s) => s.unlocked);
  const unlock = useApp((s) => s.unlock);
  const sold = useApp((s) => s.sold);
  const listings = useApp((s) => s.listings);
  const watched = useApp((s) => s.watch.includes(event.id));
  const toggleWatch = useApp((s) => s.toggleWatch);
  const fav = useApp((s) => s.favArtists.includes(event.artist));
  const toggleFav = useApp((s) => s.toggleFav);
  const setCart = useApp((s) => s.setCart);
  const artist = artistBy(event.artist);
  const phase = salePhase(event, unlocked);
  const [gate, setGate] = useState<"pending" | "queue" | "open">(event.hot ? "pending" : "open");
  const [pos, setPos] = useState(1200);
  const [qty, setQty] = useState(2);
  const [sort, setSort] = useState<"low" | "best">("low");
  const [type, setType] = useState<TypeFilter>("all");
  const [section, setSection] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState(false);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    document.title = `${event.title} | Ticketmaster`;
    if (!event.hot) {
      setGate("open");
      return;
    }
    try {
      if (sessionStorage.getItem(`tmq:${event.id}`)) setGate("open");
      else setGate("queue");
    } catch {
      setGate("open");
    }
  }, [event.id, event.hot, event.title]);

  useEffect(() => {
    if (gate !== "queue") return;
    const from = 700 + (hash(event.id) % 2200);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 400 : 3200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setPos(Math.max(0, Math.round(from * (1 - p))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        try {
          sessionStorage.setItem(`tmq:${event.id}`, "1");
        } catch {
          /* ignore */
        }
        setGate("open");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gate, event.id]);

  const offers = useMemo(() => liveOffers(event, sold, listings), [event, sold, listings]);
  const bounds = useMemo(() => {
    const nums = offers.map((o) => feesFor(o.face, event.currency, o.type).allIn);
    return [Math.floor(Math.min(...nums)), Math.ceil(Math.max(...nums))] as [number, number];
  }, [offers, event.currency]);
  const [price, setPrice] = useState<[number, number] | null>(null);
  const range = price ?? bounds;

  const pass = (o: Offer, ignoreSection = false) => {
    if (o.count < qty) return false;
    if (type !== "all" && o.type !== type) return false;
    const allIn = feesFor(o.face, event.currency, o.type).allIn;
    if (allIn < range[0] || allIn > range[1]) return false;
    if (!ignoreSection && section && o.section !== section) return false;
    return true;
  };

  const visible = offers.filter((o) => pass(o)).sort((a, b) => {
    const pa = feesFor(a.face, event.currency, a.type).allIn;
    const pb = feesFor(b.face, event.currency, b.type).allIn;
    if (sort === "best") return RANK[a.tier] - RANK[b.tier] || pa - pb;
    return pa - pb;
  });
  const mapPool = offers.filter((o) => pass(o, true));
  const prices: Record<string, number> = {};
  for (const o of mapPool) {
    const allIn = feesFor(o.face, event.currency, o.type).allIn;
    prices[o.section] = prices[o.section] == null ? allIn : Math.min(prices[o.section], allIn);
  }
  const selected = visible.find((o) => o.id === sel) ?? null;
  const more = events.filter((e) => e.artist === event.artist && e.id !== event.id).sort(byDate).slice(0, 6);

  function goNext(o: Offer) {
    const seats = Array.from({ length: qty }, (_, i) => o.seatFrom + i);
    setCart({
      eventId: event.id,
      offerId: o.id,
      qty,
      section: o.section,
      row: o.row,
      seats,
      face: o.face,
      type: o.type,
      tier: o.tier,
      currency: event.currency,
      expires: Date.now() + 10 * 60 * 1000,
    });
    if (!useApp.getState().user) useApp.getState().demoIn();
    void navigate({ to: "/checkout" });
  }

  const allInSel = selected ? feesFor(selected.face, event.currency, selected.type).allIn : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28">
      {gate !== "open" ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6 text-center">
          <p className="text-2xl font-extrabold tracking-tighter">ticketmaster</p>
          <h1 className="mt-8 text-2xl font-extrabold">{gate === "queue" && pos === 0 ? t("youreIn") : t("queueTitle")}</h1>
          <p className="mt-2 max-w-md text-muted">{t("queueBody")}</p>
          <p className="mt-6 text-6xl font-extrabold tabular-nums text-blue">{pos}</p>
          <p className="text-sm text-muted">{t("usersAhead")}</p>
          <div className="mt-6 h-2 w-64 overflow-hidden rounded-full bg-surface">
            <div className="h-full bg-blue" style={{ width: `${Math.max(8, 100 - Math.min(100, pos / 20))}%` }} />
          </div>
          <p className="mt-8 text-sm font-semibold">{event.title}</p>
          <p className="text-sm text-muted">
            {event.venue} · {placeLine(event)}
          </p>
          <p className="mt-6 max-w-sm text-xs text-subtle">{t("dontRefresh")}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-2 py-3">
        <Link to="/" className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface" aria-label={t("back")}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-sm text-muted">
          {t(event.category)} · {event.market === "us" ? t("marketUs") : t("marketEs")}
        </p>
        <div className="ml-auto flex items-center">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center"
            aria-label={t("share")}
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href).then(
                () => toast(t("copied")),
                () => toast(t("copied")),
              );
            }}
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center"
            aria-pressed={watched}
            aria-label={t("watchlist")}
            onClick={() => toast(toggleWatch(event.id) ? t("addedWatch") : t("removedWatch"))}
          >
            <Heart className={cn("h-5 w-5", watched ? "fill-heart text-heart" : "")} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="overflow-hidden rounded-xl bg-surface">
            <img src={eventImage(event)} alt="" className="aspect-[16/8] w-full object-cover" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{event.title}</h1>
          {event.sub ? <p className="text-lg text-muted">{event.sub}</p> : null}
          <p className="mt-1 font-semibold">
            {formatWhen(event.date, lang, "long")} · {formatWhen(event.date, lang, "time")}
          </p>
          <p className="text-muted">
            {event.venue} · {placeLine(event)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {event.hot ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-fg px-3 py-1 text-xs font-bold uppercase text-bg">
                <Zap className="h-3.5 w-3.5" /> {t("highDemand")}
              </span>
            ) : null}
            {event.limited ? <span className="rounded-full bg-danger px-3 py-1 text-xs font-bold uppercase text-on-blue">{t("limited")}</span> : null}
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold">{lang === "es" ? event.ageEs : event.ageEn}</span>
          </div>
          {artist ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line p-3">
              <Link to="/artist/$slug" params={{ slug: artist.slug }} className="min-w-0">
                <p className="truncate font-bold">{artist.name}</p>
                <p className="text-sm text-muted">{lang === "es" ? artist.genreEs : artist.genreEn}</p>
              </Link>
              <button type="button" className={fav ? btnGhost : btn} onClick={() => toggleFav(artist.slug)}>
                {fav ? t("following") : t("follow")}
              </button>
            </div>
          ) : null}
        </div>

        <div>
          {phase === "wait" ? (
            <div className="rounded-xl border border-line p-5">
              <p className="text-sm font-bold uppercase text-gold">{t("presale")}</p>
              <h2 className="mt-1 text-xl font-extrabold">{t("presaleWait")}</h2>
              <p className="mt-2 text-sm">
                {t("presaleStarts")}: {event.presaleStart ? formatWhen(event.presaleStart, lang, "long") : ""} {event.presaleStart ? formatWhen(event.presaleStart, lang, "time") : ""}
              </p>
              <p className="text-sm text-muted">
                {t("publicOn")}: {event.publicOn ? `${formatWhen(event.publicOn, lang, "long")} ${formatWhen(event.publicOn, lang, "time")}` : ""}
              </p>
              <button
                type="button"
                className={cn(btn, "mt-4")}
                onClick={() => {
                  if (!useApp.getState().watch.includes(event.id)) toggleWatch(event.id);
                  toast(t("reminded"));
                }}
              >
                {t("setReminder")}
              </button>
            </div>
          ) : null}

          {phase === "code" ? (
            <form
              className="rounded-xl border border-line p-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim().toUpperCase() === (event.presaleCode ?? "").toUpperCase()) {
                  unlock(event.id);
                  setCodeErr(false);
                } else setCodeErr(true);
              }}
            >
              <p className="text-sm font-bold uppercase text-gold">{t("presaleOpen")}</p>
              <h2 className="mt-1 text-xl font-extrabold">{t("code")}</h2>
              <p className="mt-2 text-sm text-muted">{t("citiHint")}</p>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("codePh")} className="mt-3 h-11 w-full rounded border border-line px-3" />
              {codeErr ? <p className="mt-2 text-sm font-semibold text-danger">{t("badCode")}</p> : null}
              <button type="submit" className={cn(btn, "mt-3 w-full")}>
                {t("unlock")}
              </button>
            </form>
          ) : null}

          {phase === "open" ? (
            <div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs font-bold uppercase text-muted">
                  {t("qty")}
                  <select value={qty} onChange={(e) => { setQty(Number(e.target.value)); setSel(null); }} className="mt-1 block h-11 rounded border border-line bg-bg px-2 text-sm font-semibold text-fg">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold uppercase text-muted">
                  {t("type")}
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as TypeFilter);
                      setSel(null);
                    }}
                    className="mt-1 block h-11 rounded border border-line bg-bg px-2 text-sm font-semibold text-fg"
                  >
                    <option value="all">{t("allTickets")}</option>
                    <option value="standard">{t("standard")}</option>
                    <option value="resale">{t("resale")}</option>
                    <option value="platinum">{t("platinum")}</option>
                    <option value="vip">{t("vip")}</option>
                    <option value="accessible">{t("accessible")}</option>
                  </select>
                </label>
                <label className="text-xs font-bold uppercase text-muted">
                  {t("sort")}
                  <select value={sort} onChange={(e) => setSort(e.target.value as "low" | "best")} className="mt-1 block h-11 rounded border border-line bg-bg px-2 text-sm font-semibold text-fg">
                    <option value="low">{t("sortLow")}</option>
                    <option value="best">{t("sortBest")}</option>
                  </select>
                </label>
                <button type="button" className="mb-0.5 text-sm font-bold text-blue lg:hidden" onClick={() => setShowMap((v) => !v)}>
                  {showMap ? t("hideMap") : t("showMap")}
                </button>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{t("price")}</span>
                  <span>
                    {money(range[0], event.currency, lang)} {t("to")} {money(range[1], event.currency, lang)}
                  </span>
                </div>
                <Slider.Root
                  min={bounds[0]}
                  max={bounds[1]}
                  step={1}
                  value={range}
                  onValueChange={(v) => {
                    const next: [number, number] = [v[0] ?? bounds[0], v[1] ?? bounds[1]];
                    setPrice(next);
                    setSel(null);
                  }}
                  className="relative flex h-11 items-center"
                  minStepsBetweenThumbs={1}
                >
                  <Slider.Track className="relative h-1 grow rounded-full bg-surface-2">
                    <Slider.Range className="absolute h-full rounded-full bg-blue" />
                  </Slider.Track>
                  <Slider.Thumb aria-label={t("price")} className="block h-5 w-5 rounded-full border-2 border-blue bg-bg" />
                  <Slider.Thumb aria-label={t("price")} className="block h-5 w-5 rounded-full border-2 border-blue bg-bg" />
                </Slider.Root>
              </div>
              {(section || type !== "all" || price) && (
                <button
                  type="button"
                  className="text-sm font-bold text-blue"
                  onClick={() => {
                    setSection(null);
                    setType("all");
                    setPrice(null);
                    setSel(null);
                  }}
                >
                  {t("clearFilters")}
                </button>
              )}
              <p className="mt-2 text-sm text-muted">
                {visible.length} {t("listings")} · {t("includesFees")}
              </p>
              {showMap ? (
                <div className="mt-3">
                  <SeatMap
                    kind={event.kind}
                    label={event.label}
                    available={new Set(Object.keys(prices))}
                    selected={section}
                    prices={prices}
                    currency={event.currency}
                    lang={lang}
                    onPick={(id) => {
                      setSection((cur) => (cur === id ? null : id));
                      setSel(null);
                    }}
                  />
                  <p className="mt-2 text-xs text-muted">{t("mapHint")}</p>
                </div>
              ) : null}
              <ul className="mt-3 max-h-[36rem] space-y-2 overflow-y-auto pr-1">
                {visible.length === 0 ? <li className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">{t("noMatch")}</li> : null}
                {visible.map((o) => {
                  const fee = feesFor(o.face, event.currency, o.type);
                  const on = sel === o.id;
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => setSel(o.id)}
                        className={cn("w-full rounded-xl border p-3 text-left", on ? "border-blue bg-blue-soft" : "border-line hover:border-fg")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">
                              {sectionName(o.section, lang)} · {t("row")} {o.row}
                            </p>
                            <p className="text-sm text-muted">{t("together", { n: Math.min(qty, o.count) })}</p>
                            <p className="text-xs font-semibold uppercase text-subtle">
                              {o.type === "resale" ? t("resale") : o.type === "platinum" ? t("platinum") : o.type === "vip" ? t("vip") : o.type === "accessible" ? t("accessible") : t("standard")}
                              {o.count <= 2 ? ` · ${t("fewLeft", { n: o.count })}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold">{money(fee.allIn, event.currency, lang)}</p>
                            <p className="text-xs text-muted">{t("each")}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {o.type === "resale"
                            ? t("resaleNote")
                            : `${t("face")} ${money(o.face, event.currency, lang)} · ${t("service")} ${money(fee.service, event.currency, lang)} · ${t("facility")} ${money(fee.facility, event.currency, lang)}`}
                        </p>
                        {o.type === "platinum" ? <p className="mt-1 text-xs text-gold">{t("platinumNote")}</p> : null}
                        {o.type === "vip" ? <p className="mt-1 text-xs text-gold">{t("vipNote")}</p> : null}
                        {o.ada ? <p className="mt-1 text-xs">{t("adaNote")}</p> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-extrabold">{t("about")}</h2>
          <p className="mt-2 text-sm leading-6">{lang === "es" ? event.aboutEs : event.aboutEn}</p>
        </div>
        <div className="rounded-xl bg-surface p-4">
          <h2 className="font-extrabold">{t("important")}</h2>
          <p className="mt-2 text-sm leading-6">{t("infoBody")}</p>
          <p className="mt-2 text-sm">
            {t("entry")}: {entryLevel(event.kind === "club" ? "ga" : "lower", lang)} · {t("gate")} A
          </p>
        </div>
      </section>

      {more.length ? (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold">{t("fansAlso")}</h2>
          <ul className="mt-2 divide-y divide-line">
            {more.map((e) => (
              <li key={e.id}>
                <Link to="/event/$eventId" params={{ eventId: e.id }} className="flex items-center justify-between gap-3 py-3">
                  <span>
                    <span className="block font-bold">{formatWhen(e.date, lang, "long")}</span>
                    <span className="block text-sm text-muted">
                      {e.venue} · {placeLine(e)}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-blue">{t("seeListings")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selected && phase === "open" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {qty} {qty === 1 ? t("ticketWord") : t("ticketsWord")} · {sectionName(selected.section, lang)} · {t("row")} {selected.row}
              </p>
              <p className="text-sm text-muted">
                {t("freeForYou")} · {t("listedAt", { price: money(allInSel * qty, event.currency, lang) })}
              </p>
            </div>
            <button type="button" className={cn(btn, "ml-auto px-6")} onClick={() => goNext(selected)}>
              {t("getFree")}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
