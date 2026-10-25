import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { eventImage, getEvent, placeLine } from "@/data/catalog";
import { formatWhen, money } from "@/lib/format";
import { entryLevel, hash, sectionName } from "@/lib/offers";
import { useApp } from "@/lib/store";
import { useT } from "@/components/use-t";

export const Route = createFileRoute("/ticket/$orderId")({
  component: TicketPage,
});

function gateFor(section: string) {
  const n = Number.parseInt(section, 10);
  if (Number.isNaN(n)) return "GA";
  if (n < 110) return "A";
  if (n < 200) return "B";
  if (n < 300) return "C";
  return "D";
}

function TicketPage() {
  const { orderId } = Route.useParams();
  const { t, lang } = useT();
  const navigate = useNavigate();
  const order = useApp((s) => s.orders.find((o) => o.id === orderId));
  const event = order ? getEvent(order.eventId) : undefined;
  const [i, setI] = useState(0);
  const [bucket, setBucket] = useState(() => Math.floor(Date.now() / 15000));
  const [left, setLeft] = useState(15);
  const [tilt, setTilt] = useState({ x: 62, y: 28 });
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const b = Math.floor(now / 15000);
      setBucket(b);
      setLeft(15 - Math.floor((now % 15000) / 1000));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onTilt = (e: DeviceOrientationEvent) => {
      const g = e.gamma ?? 0;
      const b = e.beta ?? 45;
      setTilt({
        x: Math.max(12, Math.min(88, 50 + g * 0.8)),
        y: Math.max(10, Math.min(80, b * 0.45)),
      });
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, []);

  if (!order || !event) {
    return (
      <main className="bg-ticket px-4 py-16 text-center text-ticket-fg">
        <h1 className="text-2xl font-extrabold">{t("notFound")}</h1>
        <Link to="/tickets" className="mt-3 inline-flex text-blue">
          {t("myTickets")}
        </Link>
      </main>
    );
  }

  const seat = order.seats[Math.min(i, order.seats.length - 1)] ?? order.seats[0];
  const active = order.status === "confirmed";
  const start = new Date(event.date);
  const doors = new Date(start.getTime() - 90 * 60 * 1000);
  const gate = gateFor(order.section);
  const token = `TM1.${order.id}.${event.id}.${order.section}.${order.row}.${seat}.${bucket}.${(hash(`${order.id}|${seat}|${bucket}`) >>> 0).toString(16)}`;
  const orderNo = order.id.length > 6 ? `${order.id.slice(0, 2)}-${order.id.slice(2, 8)}/${event.market.toUpperCase()}` : order.id;

  return (
    <main className="min-h-screen bg-ticket text-ticket-fg">
      <div className="bg-blue px-4 py-3 text-on-blue">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button type="button" aria-label={t("back")} className="grid h-11 w-11 place-items-center" onClick={() => void navigate({ to: "/tickets" })}>
            <ChevronLeft />
          </button>
          <p className="font-extrabold tracking-tighter">ticketmaster</p>
          <div className="text-right text-sm font-semibold leading-tight">
            <div>{formatWhen(event.date, lang, "short")}</div>
            <div>{formatWhen(event.date, lang, "time")}</div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-lg">
        <img src={eventImage(event)} alt="" className="aspect-[16/7] w-full object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${tilt.x}% ${tilt.y}%, color-mix(in srgb, var(--color-on-blue) 55%, transparent), transparent 42%)`,
          }}
        />
      </div>

      <div className="mx-auto max-w-lg px-5 py-5">
        <p className="text-sm font-semibold text-ticket-muted">{event.venue}</p>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{event.title}</h1>
        {event.sub ? <p className="text-sm text-ticket-muted">{event.sub}</p> : null}
        <p className="mt-1 text-sm text-ticket-muted">
          {placeLine(event)} · {formatWhen(event.date, lang, "long")} · {formatWhen(event.date, lang, "time")}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          <Cell k={t("sec")} v={order.section} />
          <Cell k={t("row")} v={order.row} />
          <Cell k={t("seat")} v={String(seat ?? "")} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-y border-ticket-muted/30 py-3 text-center text-sm">
          <div>
            <p className="text-xs font-bold uppercase text-ticket-muted">{t("gate")}</p>
            <p className="font-extrabold">{gate}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-ticket-muted">{t("doors")}</p>
            <p className="font-extrabold">{formatWhen(doors.toISOString(), lang, "time")}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-ticket-muted">{t("entry")}</p>
            <p className="font-extrabold">{entryLevel(order.tier, lang)}</p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-ticket-muted">
          {order.type === "resale" ? t("resale") : order.type === "platinum" ? t("platinum") : order.type === "vip" ? t("vip") : order.type === "accessible" ? t("accessible") : t("standard")}
          {" · "}
          {t("mobileEntry")}
        </p>

        {active ? (
          <div className="relative mt-4 overflow-hidden rounded-lg bg-bg p-3 text-fg">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-blue/25 safe-sweep" />
            <SafeQr value={token} />
            <p className="mt-2 text-center text-xs font-bold uppercase tracking-wide text-blue">{t("safetixLive")}</p>
            <p className="text-center text-sm font-extrabold tabular-nums">{t("refreshesIn", { s: left })}</p>
            <p className="mt-1 break-all text-center font-mono text-xs text-muted">{token}</p>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-ticket-muted/40 p-4 text-center">
            <p className="text-lg font-extrabold">{order.status === "listed" ? t("listed") : order.status === "sold" ? t("sold") : t("transferred")}</p>
            {order.transferEmail ? <p className="text-sm text-ticket-muted">{order.transferEmail}</p> : null}
          </div>
        )}

        {active ? (
          <p className="mt-3 text-center text-xs text-ticket-muted">
            {t("screenshotNote")} {t("tiltNote")}
          </p>
        ) : null}

        {order.seats.length > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" aria-label={t("back")} className="grid h-11 w-11 place-items-center rounded-full border border-ticket-muted" onClick={() => setI((n) => (n - 1 + order.seats.length) % order.seats.length)}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold">{t("ofSeats", { i: i + 1, n: order.seats.length })}</span>
            <button type="button" aria-label={t("next")} className="grid h-11 w-11 place-items-center rounded-full border border-ticket-muted" onClick={() => setI((n) => (n + 1) % order.seats.length)}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        <section className="mt-6 rounded-xl border border-ticket-muted/30">
          <button type="button" className="flex h-12 w-full items-center justify-between px-4 text-left font-extrabold" onClick={() => setOpen((v) => !v)}>
            {t("ticketDetails")}
            <span className="text-sm font-semibold text-ticket-muted">{open ? "–" : "+"}</span>
          </button>
          {open ? (
            <dl className="space-y-2 border-t border-ticket-muted/30 px-4 py-3 text-sm">
              <Row k={t("orderNo")} v={orderNo} />
              <Row k={t("purchaser")} v={`${order.buyer} · ${order.email}`} />
              <Row k={t("faceListed")} v={money(order.face, order.currency, lang)} />
              <Row k={t("paid")} v={order.total === 0 ? `${t("free")} · ${t("comp")}` : money(order.total, order.currency, lang)} />
              <Row k={t("billing")} v={order.last4 === "FREE" ? t("comp") : `•••• ${order.last4}`} />
              <Row k={t("delivery")} v={t("mobileEntry")} />
              <Row k={t("barcodeReady")} v={active ? t("safetixLive") : order.status} />
              <Row k={lang === "es" ? "Edad" : "Age"} v={lang === "es" ? event.ageEs : event.ageEn} />
              <Row k={t("bagPolicy")} v={t("bagBody")} />
              <Row k={t("important")} v={t("infoBody")} />
              <p className="pt-1 text-xs text-ticket-muted">{t("demoTicket")}</p>
            </dl>
          ) : null}
        </section>

        {active ? (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link to="/sell/$orderId" params={{ orderId: order.id }} className="grid h-11 place-items-center rounded bg-ticket-fg font-bold text-ticket">
              {t("listForSale")}
            </Link>
            <Transfer orderId={order.id} />
          </div>
        ) : order.status === "listed" ? (
          <button type="button" className="mt-6 h-11 w-full rounded bg-ticket-fg font-bold text-ticket" onClick={() => useApp.getState().cancelList(order.id)}>
            {t("cancelListing")}
          </button>
        ) : null}
      </div>
    </main>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-ticket-muted">{k}</p>
      <p className="text-3xl font-extrabold">{v}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2">
      <dt className="text-ticket-muted">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}

function SafeQr({ value }: { value: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let live = true;
    void import("qrcode").then((QR) =>
      QR.toString(value, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#121212", light: "#ffffff" },
      }).then((markup) => {
        if (live) setSvg(markup);
      }),
    );
    return () => {
      live = false;
    };
  }, [value]);
  if (!svg) return <div className="aspect-square w-full animate-pulse rounded bg-surface" />;
  return <div className="safe-qr" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Transfer({ orderId }: { orderId: string }) {
  const { t } = useT();
  const transfer = useApp((s) => s.transfer);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  if (!open) {
    return (
      <button type="button" className="h-11 rounded border border-ticket-muted font-bold" onClick={() => setOpen(true)}>
        {t("transfer")}
      </button>
    );
  }
  return (
    <form
      className="col-span-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.includes("@")) return;
        transfer(orderId, email);
      }}
    >
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder={t("transferTo")} className="h-11 min-w-0 flex-1 rounded px-3 text-fg" />
      <button type="submit" className="h-11 rounded bg-blue px-3 font-bold text-on-blue">
        {t("send")}
      </button>
    </form>
  );
}
