import { createFileRoute, Link } from "@tanstack/react-router";
import { guides } from "@/data/catalog";
import { useT } from "@/components/use-t";

export const Route = createFileRoute("/guide/$slug")({
  component: GuidePage,
});

function GuidePage() {
  const { slug } = Route.useParams();
  const { t, lang } = useT();
  const g = guides.find((x) => x.slug === slug);
  if (!g) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-extrabold">{t("notFound")}</h1>
        <Link to="/" className="mt-3 inline-flex font-bold text-blue">{t("backHome")}</Link>
      </main>
    );
  }
  const title = lang === "es" ? g.titleEs : g.titleEn;
  const body = lang === "es" ? g.bodyEs : g.bodyEn;
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/" className="text-sm font-bold text-blue">{t("backHome")}</Link>
      <p className="mt-4 text-xs font-bold uppercase text-muted">{t("minRead", { n: 3 })}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{title}</h1>
      {body.split("\n\n").map((p) => (
        <p key={p.slice(0, 24)} className="mt-4 text-base leading-7">{p}</p>
      ))}
    </main>
  );
}
