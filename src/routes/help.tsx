import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/components/use-t";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

function HelpPage() {
  const { t } = useT();
  const faqs = ["1", "2", "3", "4"] as const;
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("helpTitle")}</h1>
      <div className="mt-6 space-y-4">
        {faqs.map((n) => (
          <article key={n} className="rounded-xl border border-line p-4">
            <h2 className="font-bold">{t(`faq${n}q`)}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{t(`faq${n}a`)}</p>
          </article>
        ))}
      </div>
      <section className="mt-8 space-y-4 text-sm leading-6">
        <div>
          <h2 className="font-bold">{t("fanGuarantee")}</h2>
          <p className="text-muted">{t("guaranteeBody")}</p>
        </div>
        <div>
          <h2 className="font-bold">{t("gift")}</h2>
          <p className="text-muted">{t("giftBody")}</p>
        </div>
        <div>
          <h2 className="font-bold">{t("privacy")}</h2>
          <p className="text-muted">{t("privacyBody")}</p>
        </div>
      </section>
      <Link to="/guide/$slug" params={{ slug: "all-in-prices" }} className="mt-6 inline-flex font-bold text-blue">{t("read")}</Link>
    </main>
  );
}
