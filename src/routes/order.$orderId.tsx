import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { getEvent, placeLine } from "@/data/catalog";
import { formatWhen, money } from "@/lib/format";
import { sectionName } from "@/lib/offers";
import { useApp } from "@/lib/store";
import { useT } from "@/components/use-t";
import { btn, btnGhost } from "@/components/cards";

export const Route = createFileRoute("/order/$orderId")({
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const { t, lang } = useT();
  const order = useApp((s) => s.orders.find((o) => o.id === orderId));
  const event = order ? getEvent(order.eventId) : undefined;
  if (!order || !event) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">{t("notFound")}</h1>
        <Link to="/tickets" className="mt-3 inline-flex font-bold text-blue">{t("myTickets")}</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-lg px-4 py-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok-bg text-ok">
        <Check className="h-8 w-8" />
      </div>
      <p className="mt-4 text-sm font-bold uppercase text-ok">{t("orderOk")}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{event.title}</h1>
      <p className="mt-2 text-muted">
        {formatWhen(event.date, lang, "long")} · {formatWhen(event.date, lang, "time")}
      </p>
      <p className="text-muted">
        {event.venue} · {placeLine(event)}
      </p>
      <p className="mt-4 font-semibold">
        {sectionName(order.section, lang)} · {t("row")} {order.row} · {order.seats.join(", ")}
      </p>
      <p className="text-sm text-muted">
        {t("orderNo")} {order.id} · {money(order.total, order.currency, lang)}
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm">{t("confirmedBody")}</p>
      <div className="mt-6 flex flex-col gap-2">
        <Link to="/ticket/$orderId" params={{ orderId: order.id }} className={btn}>
          {t("viewTickets")}
        </Link>
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            const start = new Date(event.date);
            const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
            const pad = (n: number) => String(n).padStart(2, "0");
            const local = (d: Date) =>
              `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
            const body = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${local(start)}\nDTEND:${local(end)}\nSUMMARY:${event.title}\nLOCATION:${event.venue}, ${event.city}\nEND:VEVENT\nEND:VCALENDAR`;
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
            a.download = `${event.id}.ics`;
            a.click();
            toast(t("calAdded"));
          }}
        >
          {t("addCal")}
        </button>
      </div>
    </main>
  );
}
