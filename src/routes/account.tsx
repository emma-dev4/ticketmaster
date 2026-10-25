import { createFileRoute, Link } from "@tanstack/react-router";
import { getEvent } from "@/data/catalog";
import { money } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useT } from "@/components/use-t";
import { btn, btnGhost } from "@/components/cards";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const { t, lang } = useT();
  const hydrated = useApp((s) => s.hydrated);
  const user = useApp((s) => s.user);
  const orders = useApp((s) => s.orders);
  const favs = useApp((s) => s.favArtists);
  const openAuth = useApp((s) => s.openAuth);
  const signOut = useApp((s) => s.signOut);
  if (!hydrated) return <main className="mx-auto max-w-lg px-4 py-10" />;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">{t("accountTitle")}</h1>
        <p className="mt-2 text-muted">{t("demoNote")}</p>
        <button type="button" className={`${btn} mt-4`} onClick={() => openAuth("in")}>{t("signIn")}</button>
        <button type="button" className={`${btnGhost} mt-2`} onClick={() => openAuth("up")}>{t("createAccount")}</button>
      </main>
    );
  }
  const mine = orders.filter((o) => o.email === user.email);
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("hello", { name: user.name.split(" ")[0] ?? user.name })}</h1>
      <p className="text-muted">{user.email}</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Link to="/tickets" className={btn}>{t("myTickets")}</Link>
        <Link to="/watchlist" className={btnGhost}>{t("watchlist")}</Link>
      </div>
      <h2 className="mt-8 text-sm font-bold uppercase text-muted">{t("orders")}</h2>
      {mine.length === 0 ? <p className="mt-2 text-sm text-muted">{t("noOrders")}</p> : null}
      <ul className="mt-2 divide-y divide-line">
        {mine.map((o) => {
          const ev = getEvent(o.eventId);
          return (
            <li key={o.id}>
              <Link to="/order/$orderId" params={{ orderId: o.id }} className="flex items-center justify-between py-3">
                <span>
                  <span className="block font-bold">{ev?.title ?? o.eventId}</span>
                  <span className="block text-sm text-muted">{o.id}</span>
                </span>
                <span className="text-sm font-semibold">{money(o.total, o.currency, lang)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted">
        {t("favorites")}: {favs.length}
      </p>
      <button type="button" className={`${btnGhost} mt-6`} onClick={signOut}>{t("signOut")}</button>
    </main>
  );
}
