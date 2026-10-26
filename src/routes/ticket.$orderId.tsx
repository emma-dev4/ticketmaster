import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Info, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { eventImage, getEvent, placeLine } from "@/data/catalog";
import { money } from "@/lib/format";
import { entryLevel, hash } from "@/lib/offers";
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

function headerWhen(iso: string, lang: "en" | "es") {
  const d = new Date(iso);
  const loc = lang === "es" ? "es" : "en-US";
  const wd = new Intl.DateTimeFormat(loc, { weekday: "short" }).format(d);
  const day = new Intl.DateTimeFormat(loc, { month: "short", day: "numeric", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat(loc, { hour: "numeric", minute: "2-digit" }).format(d);
  return `${wd} · ${day} · ${time}`;
}

function TicketPage() {
  const { orderId } = Route.useParams();
  const { t, lang } = useT();
  const navigate = useNavigate();
  const order = useApp((s) => s.orders.find((o) => o.id === orderId));
  const event = order ? getEvent(order.eventId) : undefined;
  const [i, setI] = useState(0);
  const [bucket, setBucket] = useState(() => Math.floor(Date.now() / 15000));
  const [tilt, setTilt] = useState({ x: 70, y: 18 });
  const [info, setInfo] = useState(false);
  const [saved, setSaved] = useState(false);
  const touchX = useRef(0);

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "#000";
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setBucket(Math.floor(Date.now() / 15000)), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onTilt = (e: DeviceOrientationEvent) => {
      const g = e.gamma ?? 0;
      const b = e.beta ?? 40;
      setTilt({
        x: Math.max(8, Math.min(92, 58 + g * 0.9)),
        y: Math.max(6, Math.min(70, 18 + (b - 40) * 0.35)),
      });
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      setTilt({ x: (e.clientX / w) * 100, y: (e.clientY / h) * 55 });
    };
    window.addEventListener("deviceorientation", onTilt);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  if (!order || !event) {
    return (
      <main className="bg-black px-4 py-16 text-center text-white">
        <h1 className="text-2xl font-extrabold">{t("notFound")}</h1>
        <button type="button" className="mt-3 font-bold text-[#4da3ff]" onClick={() => void navigate({ to: "/tickets" })}>
          {t("myTickets")}
        </button>
      </main>
    );
  }

  const seat = order.seats[Math.min(i, order.seats.length - 1)] ?? order.seats[0];
  const active = order.status === "confirmed";
  const start = new Date(event.date);
  const doors = new Date(start.getTime() - 90 * 60 * 1000);
  const gate = gateFor(order.section);
  const ga = order.tier === "ga" || order.section === "GA";
  const seed = `${order.id}|${event.id}|${order.section}|${order.row}|${seat}|${bucket}`;
  const orderNo = order.id.length > 6 ? `${order.id.slice(0, 2)}-${order.id.slice(2, 8)}/${event.market.toUpperCase()}` : order.id;
  const when = headerWhen(event.date, lang);
  const doorTime = new Intl.DateTimeFormat(lang === "es" ? "es" : "en-US", { hour: "numeric", minute: "2-digit" }).format(doors);
  const kind = ga ? t("generalAdmission") : t("reservedSeat");
  const sub =
    order.type === "platinum" || order.type === "vip"
      ? t("upgradedTicket")
      : order.type === "resale"
        ? t("verifiedResale")
        : order.type === "accessible"
          ? t("accessibleSeat")
          : t("standardTicket");

  const step = (dir: number) => setI((n) => (n + dir + order.seats.length) % order.seats.length);

  return (
    <main className="min-h-dvh bg-black text-white">
      <header className="px-1 pb-2 pt-3">
        <div className="grid grid-cols-[44px_1fr_44px] items-center">
          <button type="button" aria-label={t("back")} className="grid h-11 w-11 place-items-center" onClick={() => void navigate({ to: "/tickets" })}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="truncate text-[15px] font-bold uppercase tracking-tight">{event.title}</h1>
            <p className="truncate text-[11px] text-[#9a9a9a]">
              {when} · {event.venue}
            </p>
          </div>
          <span />
        </div>
      </header>

      <div className="bg-[#026cdf] py-[3px] text-center text-[11px] font-bold tracking-tight">ticketmaster</div>
      <div className="flex items-center justify-center gap-1.5 bg-[#161616] py-1.5 text-[12px] text-[#d7d7d7]">
        <UserRound className="h-3.5 w-3.5" />
        {t("assignedTo")}
      </div>

      {active ? (
        <article
          className="mx-3 mt-3 overflow-hidden bg-[#111]"
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0]?.clientX ?? 0;
          }}
          onTouchEnd={(e) => {
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
            if (order.seats.length < 2) return;
            if (dx > 48) step(-1);
            if (dx < -48) step(1);
          }}
        >
          <div className="relative h-[430px] bg-black">
            <img src={eventImage(event)} alt="" className="h-full w-full object-cover object-top" />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${tilt.x}% ${tilt.y}%, rgba(255,255,255,0.42), transparent 28%)`,
              }}
            />
            <div className="absolute inset-x-3 top-3 bg-white px-3 pb-2.5 pt-2 text-black shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold leading-tight">{t("screenshotsWont")}</p>
                <RefreshCw className="h-4 w-4 shrink-0" />
              </div>
              <div className="relative mt-1.5 h-14 overflow-hidden bg-white">
                <LiveBarcode seed={seed} />
                <div className="barcode-live pointer-events-none absolute bottom-0 top-0 w-2.5 bg-[#026cdf] shadow-[0_0_12px_#026cdf]" />
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-3">
            <p className="text-[17px] font-semibold leading-tight">{kind}</p>
            <p className="text-[13px] text-[#9a9a9a]">{sub}</p>
            <div className="mt-4 grid grid-cols-3 text-left">
              <Cell k={t("secLabel")} v={ga ? "GA" : order.section} />
              <Cell k={t("rowLabel")} v={ga ? "—" : order.row} />
              <Cell k={t("seatLabel")} v={seat == null || ga ? "—" : String(seat)} />
            </div>
            <button
              type="button"
              className="mt-4 w-full bg-white py-2.5 text-center text-[13px] font-bold uppercase tracking-wide text-black"
              onClick={() => setInfo(true)}
            >
              {t("enterGate", { gate })}
            </button>
          </div>
        </article>
      ) : (
        <div className="mx-4 mt-8 rounded-xl border border-white/15 p-4 text-center">
          <p className="text-lg font-extrabold">{order.status === "listed" ? t("listed") : order.status === "sold" ? t("sold") : t("transferred")}</p>
          {order.transferEmail ? <p className="text-sm text-[#9a9a9a]">{order.transferEmail}</p> : null}
        </div>
      )}

      {order.seats.length > 1 && active ? (
        <p className="mt-3 text-center">
          <span className="rounded-full bg-[#2a2a2a] px-3 py-1 text-xs text-[#cfcfcf]">{t("ofSeats", { i: i + 1, n: order.seats.length })}</span>
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-center gap-3 px-4 pb-10">
        <button type="button" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#1c1c1e] px-3 text-left text-[11px] font-semibold leading-tight" onClick={() => setSaved(true)}>
          <WalletMark />
          <span className="max-w-[7.5rem] leading-tight">{t("addWallet")}</span>
        </button>
        <button type="button" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1c1c1e] px-4 text-sm font-semibold" onClick={() => setInfo(true)}>
          <Info className="h-4 w-4" />
          {t("ticketInfo")}
        </button>
      </div>

      {saved ? (
        <p className="mx-4 -mt-6 mb-8 text-center text-xs text-[#bdbdbd]">{t("savedDevice")}</p>
      ) : null}

      {info ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={() => setInfo(false)}>
          <div className="max-h-[88dvh] w-full overflow-auto rounded-t-2xl bg-[#1c1c1e] px-5 pb-8 pt-3" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/30" />
            <h2 className="text-lg font-bold">{t("ticketInfo")}</h2>
            <p className="mt-1 text-sm text-[#bdbdbd]">{t("wayfinding", { time: doorTime })}</p>

            <Block title={t("directions")}>
              <Row k={t("gate")} v={gate} />
              <Row k={t("doors")} v={doorTime} />
              <Row k={t("entry")} v={entryLevel(order.tier, lang)} />
              <Row k={t("secLabel")} v={order.section} />
              <Row k={t("rowLabel")} v={order.row} />
              <Row k={t("seatLabel")} v={String(seat ?? "—")} />
            </Block>
            <Block title={t("orderNo")}>
              <Row k={t("orderNo")} v={orderNo} />
              <Row k={t("purchaser")} v={order.buyer} />
              <Row k="Email" v={order.email} />
              <Row k={t("faceListed")} v={money(order.face, order.currency, lang)} />
              <Row k={t("paid")} v={order.total === 0 ? t("free") : money(order.total, order.currency, lang)} />
              <Row k={t("delivery")} v={t("mobileEntry")} />
            </Block>
            <Block title={t("eventWord")}>
              <Row k={t("eventWord")} v={event.title} />
              <Row k={t("venueWord")} v={event.venue} />
              <Row k={t("cityWord")} v={placeLine(event)} />
              <Row k={t("dateWord")} v={when} />
            </Block>
            <Block title={t("venuePolicies")}>
              <Row k={lang === "es" ? "Edad" : "Age"} v={lang === "es" ? event.ageEs : event.ageEn} />
              <Row k={t("bagPolicy")} v={t("bagBody")} />
              <Row k={t("accessibility")} v={t("accessBody")} />
            </Block>
            <Block title={t("importantInfo")}>
              <p className="text-sm text-[#d0d0d0]">{t("barcodeLine")}</p>
              <p className="mt-2 text-sm text-[#d0d0d0]">{t("infoBody")}</p>
              <p className="mt-2 text-xs text-[#8d8d8d]">{t("demoTicket")}</p>
            </Block>

            {active ? (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#9a9a9a]">{t("manage")}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" className="h-11 rounded bg-white font-bold text-black" onClick={() => void navigate({ to: "/sell/$orderId", params: { orderId: order.id } })}>
                    {t("listForSale")}
                  </button>
                  <Transfer orderId={order.id} />
                </div>
              </div>
            ) : order.status === "listed" ? (
              <button type="button" className="mt-5 h-11 w-full rounded bg-white font-bold text-black" onClick={() => useApp.getState().cancelList(order.id)}>
                {t("cancelListing")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#8e8e8e]">{k}</p>
      <p className="text-[28px] font-semibold leading-none">{v}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 border-t border-white/10 pt-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#9a9a9a]">{title}</h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[7.2rem_1fr] gap-2 text-sm">
      <dt className="text-[#9a9a9a]">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function LiveBarcode({ seed }: { seed: string }) {
  const rows = 10;
  const cols = 78;
  let h = hash(seed) || 1;
  const bits: boolean[] = [];
  for (let n = 0; n < rows * cols; n++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const x = n % cols;
    if (x < 3 || x > cols - 4) bits.push((x + Math.floor(n / cols)) % 2 === 0);
    else bits.push((h & 3) !== 0);
  }
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} className="h-14 w-full" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden>
      {bits.map((on, n) =>
        on ? <rect key={n} x={n % cols} y={Math.floor(n / cols)} width="1" height="1" fill="#111" /> : null,
      )}
    </svg>
  );
}

function WalletMark() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden>
      <rect x="1" y="3" width="20" height="12" rx="2" fill="#1c1c1e" stroke="#fff" />
      <rect x="1" y="3" width="20" height="4" fill="#f2c14e" />
      <rect x="14" y="9" width="5" height="3" rx="0.5" fill="#fff" />
    </svg>
  );
}

function Transfer({ orderId }: { orderId: string }) {
  const { t } = useT();
  const transfer = useApp((s) => s.transfer);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  if (!open) {
    return (
      <button type="button" className="h-11 rounded border border-white/30 font-bold" onClick={() => setOpen(true)}>
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
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder={t("transferTo")} className="h-11 min-w-0 flex-1 rounded px-3 text-black" />
      <button type="submit" className="h-11 rounded bg-[#026cdf] px-3 font-bold text-white">
        {t("send")}
      </button>
    </form>
  );
}
