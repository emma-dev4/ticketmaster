import { createFileRoute, Link } from "@tanstack/react-router";
import { artistBy, byDate, eventImage, events } from "@/data/catalog";
import { useApp } from "@/lib/store";
import { DateRow, btn, btnGhost } from "@/components/cards";
import { useT } from "@/components/use-t";

export const Route = createFileRoute("/artist/$slug")({
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useT();
  const artist = artistBy(slug);
  const fav = useApp((s) => s.favArtists.includes(slug));
  const toggle = useApp((s) => s.toggleFav);
  if (!artist) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-extrabold">{t("notFound")}</h1>
        <Link to="/" className="mt-3 inline-flex font-bold text-blue">{t("backHome")}</Link>
      </main>
    );
  }
  const rows = events.filter((e) => e.artist === slug).sort(byDate);
  const cover = rows[0] ? eventImage(rows[0]) : "/media/arena.jpg";
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="overflow-hidden rounded-xl bg-surface">
        <img src={cover} alt="" className="aspect-[16/7] w-full object-cover" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{artist.name}</h1>
          <p className="text-muted">{lang === "es" ? artist.genreEs : artist.genreEn}</p>
        </div>
        <button type="button" className={fav ? btnGhost : btn} onClick={() => toggle(slug)}>
          {fav ? t("following") : t("follow")}
        </button>
      </div>
      <h2 className="mt-8 text-lg font-extrabold">{t("artistEvents")}</h2>
      <div className="mt-2">{rows.map((e) => <DateRow key={e.id} event={e} />)}</div>
    </main>
  );
}
