import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Bookmark, ChevronDown, Globe, MapPin, Search, Ticket, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { artistBy, byDate, cities, events, placeLine, trending, type Category, type Market } from "@/data/catalog";
import { formatWhen, money } from "@/lib/format";
import { fromPrice } from "@/lib/offers";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/cn";
import { useT } from "@/components/use-t";

const CATS: { id: Category; key: string }[] = [
  { id: "concerts", key: "concerts" },
  { id: "sports", key: "sports" },
  { id: "arts", key: "arts" },
  { id: "family", key: "family" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const bare = path.startsWith("/checkout") || path.startsWith("/ticket/");
  const focus = bare || path.startsWith("/event/");
  const { lang } = useT();

  useEffect(() => {
    void Promise.resolve(useApp.persist.rehydrate()).finally(() => useApp.getState().markHydrated());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "es" ? "es" : "en";
  }, [lang]);

  return (
    <>
      {!bare ? <Header /> : null}
      <div className={cn(!focus && "pb-20 md:pb-0")}>{children}</div>
      {!focus ? <Footer /> : null}
      {!focus ? <TabBar /> : null}
      <AuthDialog />
      <CityDialog />
      <Toaster position="top-center" />
    </>
  );
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2 text-fg">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-blue text-lg font-black text-on-blue">t</span>
      <span className="text-xl font-extrabold tracking-tighter sm:text-2xl">ticketmaster</span>
    </Link>
  );
}

function Header() {
  const { t, lang } = useT();
  const market = useApp((s) => s.market);
  const city = useApp((s) => s.city);
  const user = useApp((s) => (s.hydrated ? s.user : null));
  const openAuth = useApp((s) => s.openAuth);
  const openLoc = useApp((s) => s.openLoc);
  const setMarket = useApp((s) => s.setMarket);
  const setLang = useApp((s) => s.setLang);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-2 text-sm">
        <button type="button" className="inline-flex min-h-11 items-center gap-1 font-semibold" onClick={() => setMarket(market === "us" ? "es" : "us")}>
          <Globe className="h-4 w-4 text-blue" />
          {market === "us" ? t("unitedStates") : t("spain")}
          <ChevronDown className="h-4 w-4" />
        </button>
        <button type="button" className="inline-flex min-h-11 items-center gap-1" onClick={() => setLang(lang === "en" ? "es" : "en")}>
          {lang === "en" ? t("english") : t("espanol")}
          <ChevronDown className="h-4 w-4" />
        </button>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/help" className="hidden min-h-11 items-center sm:inline-flex">
            {t("help")}
          </Link>
          <Link to="/tickets" className="hidden min-h-11 items-center font-semibold sm:inline-flex">
            {t("sell")}
          </Link>
          {user ? (
            <Link to="/account" className="inline-flex min-h-11 items-center gap-1 font-bold">
              <UserRound className="h-4 w-4" />
              <span className="max-w-32 truncate">{user.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <button type="button" className="inline-flex min-h-11 items-center font-bold" onClick={() => openAuth("in")}>
              {t("signIn")}
            </button>
          )}
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pb-2">
        <Wordmark />
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchForm />
        </div>
        <button type="button" className="ml-auto inline-flex min-h-11 max-w-48 items-center gap-1 rounded-full border border-line px-3 text-sm font-semibold md:ml-0" onClick={openLoc}>
          <MapPin className="h-4 w-4 shrink-0 text-blue" />
          <span className="truncate">{city}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
      </div>
      <div className="mx-auto px-4 pb-3 md:hidden">
        <SearchForm />
      </div>
      <nav className="rail mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
        {CATS.map((c) => {
          const active = path === `/discover/${c.id}`;
          return (
            <Link
              key={c.id}
              to="/discover/$category"
              params={{ category: c.id }}
              search={{ when: "all" }}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold",
                active ? "border-blue text-blue" : "border-transparent text-fg",
              )}
            >
              {t(c.key)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function SearchForm() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const market = useApp((s) => s.market);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return events
      .filter((e) => {
        const a = artistBy(e.artist);
        return `${e.title} ${e.sub ?? ""} ${e.venue} ${e.city} ${a?.name ?? ""}`.toLowerCase().includes(s);
      })
      .sort(byDate)
      .slice(0, 6);
  }, [q]);

  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        void navigate({ to: "/search", search: { q, where: market } });
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        id="site-search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t("searchPh")}
        aria-label={t("searchPh")}
        className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm outline-none focus:border-blue focus:bg-bg"
      />
      {open && (q.trim() || true) ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-line bg-bg shadow-lg">
          {!q.trim() ? (
            <div className="p-3">
              <p className="mb-2 text-xs font-bold uppercase text-muted">{t("trending")}</p>
              <div className="flex flex-wrap gap-2">
                {trending[market].slice(0, 6).map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold"
                    onClick={() => {
                      setOpen(false);
                      void navigate({ to: "/search", search: { q: term, where: market } });
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul>
              {hits.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: e.id }}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-surface"
                    onClick={() => setOpen(false)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{e.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {formatWhen(e.date, lang, "short")} · {placeLine(e)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold">{money(fromPrice(e), e.currency, lang)}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button type="submit" className="w-full px-3 py-3 text-left text-sm font-bold text-blue">
                  {t("seeAll")} “{q}”
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </form>
  );
}

function TabBar() {
  const { t } = useT();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/", label: t("home"), icon: Ticket, on: path === "/" },
    { to: "/watchlist", label: t("watchlist"), icon: Bookmark, on: path.startsWith("/watchlist") },
    { to: "/tickets", label: t("myTickets"), icon: Ticket, on: path.startsWith("/tickets") },
    { to: "/account", label: t("account"), icon: UserRound, on: path.startsWith("/account") },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-bg md:hidden">
      {items.map((item) => (
        <Link key={item.to} to={item.to} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold", item.on ? "text-blue" : "text-muted")}>
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function Footer() {
  const { t } = useT();
  return (
    <footer className="mt-16 border-t border-line bg-footer text-footer-fg">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-footer-muted">{t("help")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/help" className="hover:underline">{t("helpTitle")}</Link></li>
            <li><Link to="/guide/$slug" params={{ slug: "all-in-prices" }} className="hover:underline">{t("price")}</Link></li>
            <li><Link to="/guide/$slug" params={{ slug: "safetix" }} className="hover:underline">SafeTix</Link></li>
            <li><Link to="/guide/$slug" params={{ slug: "what-to-bring" }} className="hover:underline">{t("important")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-footer-muted">{t("account")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/account" className="hover:underline">{t("signIn")}</Link></li>
            <li><Link to="/tickets" className="hover:underline">{t("myTickets")}</Link></li>
            <li><Link to="/watchlist" className="hover:underline">{t("watchlist")}</Link></li>
            <li><Link to="/tickets" className="hover:underline">{t("sell")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-footer-muted">{t("aboutUs")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/help" className="hover:underline">{t("fanGuarantee")}</Link></li>
            <li><Link to="/help" className="hover:underline">{t("privacy")}</Link></li>
            <li><Link to="/help" className="hover:underline">{t("gift")}</Link></li>
            <li><Link to="/guide/$slug" params={{ slug: "your-account" }} className="hover:underline">{t("accountTitle")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-footer-muted">{t("getApp")}</h2>
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" className="min-h-11 rounded border border-footer-muted px-3 text-left text-sm font-semibold" onClick={() => toast(t("appSoon"))}>
              {t("appStore")}
            </button>
            <button type="button" className="min-h-11 rounded border border-footer-muted px-3 text-left text-sm font-semibold" onClick={() => toast(t("appSoon"))}>
              {t("googlePlay")}
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-6 text-xs text-footer-muted">
          <p>{t("disclaimer")}</p>
          <p>{t("byContinuing")}</p>
          <p className="font-extrabold tracking-tighter text-footer-fg">ticketmaster</p>
        </div>
      </div>
    </footer>
  );
}

function AuthDialog() {
  const { t } = useT();
  const open = useApp((s) => s.authOpen);
  const mode = useApp((s) => s.authMode);
  const close = useApp((s) => s.closeAuth);
  const openAuth = useApp((s) => s.openAuth);
  const signIn = useApp((s) => s.signIn);
  const signUp = useApp((s) => s.signUp);
  const demoIn = useApp((s) => s.demoIn);
  const pending = useApp((s) => s.pendingCheckout);
  const setPending = useApp((s) => s.setPending);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [forgot, setForgot] = useState(false);

  function after() {
    toast(t("welcome"));
    if (pending || useApp.getState().pendingCheckout) {
      setPending(false);
      void navigate({ to: "/checkout" });
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? openAuth(mode) : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-fg/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-bg p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-xl font-extrabold">{mode === "in" ? t("signInTitle") : t("createTitle")}</Dialog.Title>
            <Dialog.Close className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface" aria-label={t("close")}>
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <p className="mt-1 text-sm text-muted">{t("demoNote")}</p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setErr("");
              if (mode === "up") {
                const res = signUp(name, email, password);
                if (res === "ok") after();
                else if (res === "short") setErr(t("passwordShort"));
                else if (res === "exists") setErr(t("badLogin"));
                else setErr(t("required"));
              } else {
                const res = signIn(email, password);
                if (res === "ok") after();
                else if (res === "short") setErr(t("passwordShort"));
                else setErr(t("badLogin"));
              }
            }}
          >
            {mode === "up" ? (
              <label className="block text-sm font-semibold">
                {t("name")}
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded border border-line px-3 font-normal" autoComplete="name" />
              </label>
            ) : null}
            <label className="block text-sm font-semibold">
              {t("email")}
              <input id="auth-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 h-11 w-full rounded border border-line px-3 font-normal" autoComplete="email" />
            </label>
            <label className="block text-sm font-semibold">
              {t("password")}
              <input id="auth-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 h-11 w-full rounded border border-line px-3 font-normal" autoComplete={mode === "up" ? "new-password" : "current-password"} />
            </label>
            {err ? <p className="text-sm font-semibold text-danger">{err}</p> : null}
            <button type="submit" className="h-11 w-full rounded bg-blue font-bold text-on-blue">
              {mode === "in" ? t("signIn") : t("createAccount")}
            </button>
          </form>
          <button type="button" className="mt-3 text-sm font-semibold text-blue" onClick={() => setForgot((v) => !v)}>
            {t("forgot")}
          </button>
          {forgot ? <p className="mt-1 text-sm text-muted">{t("forgotBody")}</p> : null}
          <div className="my-4 text-center text-xs uppercase text-muted">{t("or")}</div>
          <div className="grid gap-2">
            <button
              type="button"
              className="h-11 rounded border border-line text-sm font-bold"
              onClick={() => {
                demoIn();
                toast(t("socialNote"));
                after();
              }}
            >
              {t("google")}
            </button>
            <button
              type="button"
              className="h-11 rounded border border-line text-sm font-bold"
              onClick={() => {
                demoIn();
                toast(t("socialNote"));
                after();
              }}
            >
              {t("apple")}
            </button>
          </div>
          <button type="button" className="mt-4 text-sm font-bold text-blue" onClick={() => openAuth(mode === "in" ? "up" : "in")}>
            {mode === "in" ? t("needAccount") : t("haveAccount")}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CityDialog() {
  const { t } = useT();
  const open = useApp((s) => s.locOpen);
  const close = useApp((s) => s.closeLoc);
  const openLoc = useApp((s) => s.openLoc);
  const market = useApp((s) => s.market);
  const city = useApp((s) => s.city);
  const setCity = useApp((s) => s.setCity);
  const setMarket = useApp((s) => s.setMarket);
  const [q, setQ] = useState("");
  const list = cities[market].filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? openLoc() : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-fg/40" />
        <Dialog.Content className="fixed left-1/2 top-8 z-50 flex max-h-[min(40rem,calc(100%-4rem))] w-[min(100%-2rem,28rem)] -translate-x-1/2 flex-col rounded-xl bg-bg p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xl font-extrabold">{t("locationTitle")}</Dialog.Title>
            <Dialog.Close className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface" aria-label={t("close")}>
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["us", "es"] as Market[]).map((m) => (
              <button key={m} type="button" className={cn("h-11 rounded border text-sm font-bold", market === m ? "border-blue bg-blue-soft text-blue" : "border-line")} onClick={() => setMarket(m)}>
                {m === "us" ? t("unitedStates") : t("spain")}
              </button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("popularCities")} className="mt-3 h-11 rounded border border-line px-3" />
          <ul className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {list.map((c) => (
              <li key={c}>
                <button type="button" className={cn("flex min-h-11 w-full items-center justify-between px-1 text-left", c === city && "font-bold text-blue")} onClick={() => setCity(c)}>
                  {c}
                  {c === city ? <MapPin className="h-4 w-4" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
