import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getEvent } from "@/data/catalog";
import { money } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useT } from "@/components/use-t";
import { btn } from "@/components/cards";

export const Route = createFileRoute("/sell/$orderId")({
  component: SellPage,
});

function SellPage() {
  const { orderId } = Route.useParams();
  const { t, lang } = useT();
  const navigate = useNavigate();
  const order = useApp((s) => s.orders.find((o) => o.id === orderId));
  const list = useApp((s) => s.listOrder);
  const event = order ? getEvent(order.eventId) : undefined;
  const [price, setPrice] = useState(order ? String(Math.round((order.total / Math.max(1, order.seats.length)) * 1.1)) : "");
  const [err, setErr] = useState("");
  if (!order || !event || order.status !== "confirmed") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-extrabold">{t("notFound")}</h1>
        <Link to="/tickets" className="mt-3 inline-flex font-bold text-blue">{t("myTickets")}</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("sellTitle")}</h1>
      <p className="mt-2 text-muted">{event.title}</p>
      <p className="mt-4 text-sm leading-6">{t("sellBody")}</p>
      <p className="mt-2 text-sm text-muted">{t("sellerFee")}</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(price);
          if (!Number.isFinite(n) || n <= 0) {
            setErr(t("badPrice"));
            return;
          }
          if (!list(order.id, Math.round(n * 100) / 100)) {
            setErr(t("badPrice"));
            return;
          }
          toast(t("listedOk"));
          void navigate({ to: "/ticket/$orderId", params: { orderId: order.id } });
        }}
      >
        <label className="block text-sm font-semibold">
          {t("askPrice")}
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="mt-1 h-11 w-full rounded border border-line px-3 font-normal" />
        </label>
        <p className="text-sm text-muted">
          {t("together", { n: order.seats.length })} · {money(Number(price) || 0, order.currency, lang)} {t("each")}
        </p>
        {err ? <p className="text-sm font-semibold text-danger">{err}</p> : null}
        <button type="submit" className={`${btn} w-full`}>{t("confirmList")}</button>
      </form>
    </main>
  );
}
