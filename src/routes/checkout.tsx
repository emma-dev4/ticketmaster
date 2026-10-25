import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getEvent, placeLine } from "@/data/catalog";
import { formatWhen, money } from "@/lib/format";
import { feesFor, processingFee, sectionName } from "@/lib/offers";
import { useApp } from "@/lib/store";
import { useT } from "@/components/use-t";
import { btn } from "@/components/cards";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
});

export function Checkout() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const cart = useApp((s) => s.cart);
  const user = useApp((s) => (s.hydrated ? s.user : null));
  const hydrated = useApp((s) => s.hydrated);
  const place = useApp((s) => s.placeOrder);
  const clearCart = useApp((s) => s.clearCart);
  const event = cart ? getEvent(cart.eventId) : undefined;
  const [left, setLeft] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cart) return;
    const tick = () => setLeft(Math.max(0, cart.expires - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [cart]);

  if (!cart || !event) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">{t("emptyCart")}</h1>
        <Link to="/" className={cn(btn, "mt-4")}>{t("browse")}</Link>
      </main>
    );
  }

  const fee = feesFor(cart.face, cart.currency, cart.type);
  const processing = processingFee(cart.currency);
  const total = Math.round((fee.allIn * cart.qty + processing) * 100) / 100;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  const expired = hydrated && left <= 0;

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <Link to="/event/$eventId" params={{ eventId: event.id }} className="text-sm font-bold text-blue">
          {t("back")}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">{t("checkout")}</h1>
          <p className={cn("font-bold tabular-nums", expired ? "text-danger" : "text-fg")}>
            {t("timeLeft")} {mm}:{ss}
          </p>
        </div>
        {expired ? <p className="mt-2 text-sm font-semibold text-danger">{t("expired")}</p> : <p className="text-sm text-muted">{t("hold")}</p>}

        <section className="mt-6 rounded-xl border border-line p-4">
          <h2 className="font-extrabold">{t("delivery")}</h2>
          <label className="mt-3 flex gap-3 rounded-lg border border-blue bg-blue-soft p-3">
            <input type="radio" checked readOnly className="mt-1" />
            <span>
              <span className="block font-bold">{t("mobileEntry")}</span>
              <span className="block text-sm text-muted">{t("mobileBody")}</span>
            </span>
          </label>
        </section>

        <section className="mt-4 rounded-xl border border-line p-4">
          <h2 className="font-extrabold">{t("payment")}</h2>
          <p className="mt-1 text-sm text-muted">{t("freeNote")}</p>
          {err ? <p className="mt-3 text-sm font-semibold text-danger">{err}</p> : null}
          <button
            type="button"
            disabled={busy || expired}
            className={cn(btn, "mt-4 w-full")}
            onClick={() => {
              if (expired) {
                clearCart();
                setErr(t("expired"));
                return;
              }
              if (!useApp.getState().user) useApp.getState().demoIn();
              setBusy(true);
              window.setTimeout(() => {
                const order = place("FREE");
                setBusy(false);
                if (!order) {
                  setErr(t("expired"));
                  return;
                }
                void navigate({ to: "/order/$orderId", params: { orderId: order.id } });
              }, 400);
            }}
          >
            {busy ? t("secure") : t("claim")}
          </button>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-line p-4 lg:sticky lg:top-4">
        <h2 className="font-extrabold">{t("summary")}</h2>
        <p className="mt-2 font-bold">{event.title}</p>
        <p className="text-sm text-muted">
          {formatWhen(event.date, lang, "long")} · {formatWhen(event.date, lang, "time")}
        </p>
        <p className="text-sm text-muted">
          {event.venue} · {placeLine(event)}
        </p>
        <p className="mt-3 text-sm font-semibold">
          {sectionName(cart.section, lang)} · {t("row")} {cart.row} · {t("seats")} {cart.seats.join(", ")}
        </p>
        <p className="text-sm text-muted">{cart.type === "resale" ? t("resale") : cart.type === "platinum" ? t("platinum") : cart.type === "vip" ? t("vip") : cart.type === "accessible" ? t("accessible") : t("standard")}</p>
        <dl className="mt-4 space-y-1 text-sm">
          {cart.type === "resale" ? (
            <div className="flex justify-between">
              <dt>{t("resale")} × {cart.qty}</dt>
              <dd>{money(fee.allIn * cart.qty, cart.currency, lang)}</dd>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <dt>{t("face")} × {cart.qty}</dt>
                <dd>{money(cart.face * cart.qty, cart.currency, lang)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("service")} × {cart.qty}</dt>
                <dd>{money(fee.service * cart.qty, cart.currency, lang)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("facility")} × {cart.qty}</dt>
                <dd>{money(fee.facility * cart.qty, cart.currency, lang)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between text-muted">
            <dt>{t("processing")}</dt>
            <dd className="line-through">{money(processing, cart.currency, lang)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold">
            <dt>{t("youPay")}</dt>
            <dd>{t("free")}</dd>
          </div>
          <div className="flex justify-between text-sm text-ok">
            <dt>{t("waived")}</dt>
            <dd>{money(total, cart.currency, lang)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">{user ? user.email : t("signIn")}</p>
      </aside>
    </main>
  );
}
