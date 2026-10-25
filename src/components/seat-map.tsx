import { useState, type ReactNode } from "react";
import type { Currency, VenueKind } from "@/data/catalog";
import { money, type Lang } from "@/lib/format";
import { POOLS, sectionName } from "@/lib/offers";

type Props = {
  kind: VenueKind;
  label: string;
  available: Set<string>;
  selected?: string | null;
  prices: Record<string, number>;
  currency: Currency;
  lang: Lang;
  onPick: (id: string) => void;
};

function wedge(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  const [x0, y0] = p(r1, a0);
  const [x1, y1] = p(r1, a1);
  const [x2, y2] = p(r0, a1);
  const [x3, y3] = p(r0, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

function mid(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const a = (a0 + a1) / 2;
  const r = (r0 + r1) / 2;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

export function SeatMap(props: Props) {
  const [hover, setHover] = useState<string | null>(null);
  if (props.kind === "theater") return <Theater {...props} hover={hover} setHover={setHover} />;
  if (props.kind === "club") return <Club {...props} hover={hover} setHover={setHover} />;
  return <Bowl {...props} hover={hover} setHover={setHover} />;
}

function fill(id: string, available: Set<string>, selected?: string | null) {
  if (id === selected) return "var(--color-blue-dark)";
  if (available.has(id)) return "var(--color-blue)";
  return "var(--color-map-off)";
}

function ink(id: string, available: Set<string>) {
  return available.has(id) ? "var(--color-on-blue)" : "var(--color-map-text)";
}

function Bowl({
  label,
  available,
  selected,
  prices,
  currency,
  lang,
  onPick,
  hover,
  setHover,
}: Props & { hover: string | null; setHover: (id: string | null) => void }) {
  const cx = 200;
  const cy = 214;
  const a0 = (18 * Math.PI) / 180;
  const a1 = (162 * Math.PI) / 180;
  const rings: { ids: string[]; r0: number; r1: number }[] = [
    { ids: ["301", "302", "303", "304", "305", "306", "307", "308", "309", "310"], r0: 150, r1: 188 },
    { ids: ["201", "202", "203", "204", "205", "206"], r0: 112, r1: 146 },
    { ids: ["101", "102", "103", "104", "105", "106", "107", "108"], r0: 76, r1: 108 },
  ];
  const shapes = rings.flatMap((ring) =>
    ring.ids.map((id, i) => {
      const span = (a1 - a0) / ring.ids.length;
      const s = a0 + span * i + 0.012;
      const e = a0 + span * (i + 1) - 0.012;
      const [x, y] = mid(cx, cy, ring.r0, ring.r1, s, e);
      return { id, d: wedge(cx, cy, ring.r0, ring.r1, s, e), x, y };
    }),
  );
  const floors = [
    { id: "FL1", x: 156, y: 158, w: 40, h: 32 },
    { id: "FL2", x: 204, y: 158, w: 40, h: 32 },
  ];
  return (
    <MapFrame hover={hover} prices={prices} currency={currency} lang={lang} label={label}>
      <svg viewBox="0 0 400 390" className="h-auto w-full">
        <rect x="118" y="18" width="164" height="28" rx="4" fill="var(--color-fg)" />
        <text x="200" y="37" textAnchor="middle" fill="var(--color-bg)" fontSize="11" fontWeight="700">
          {label}
        </text>
        {shapes.map((s) => (
          <path
            key={s.id}
            d={s.d}
            fill={fill(s.id, available, selected)}
            stroke="var(--color-bg)"
            strokeWidth="2"
            role="button"
            tabIndex={0}
            aria-label={sectionName(s.id, lang)}
            onClick={() => onPick(s.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick(s.id);
              }
            }}
            onMouseEnter={() => setHover(s.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(s.id)}
            onBlur={() => setHover(null)}
          />
        ))}
        {shapes.map((s) => (
          <text key={`${s.id}-t`} x={s.x} y={s.y + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill={ink(s.id, available)} pointerEvents="none">
            {s.id}
          </text>
        ))}
        {floors.map((f) => (
          <g key={f.id}>
            <rect
              x={f.x}
              y={f.y}
              width={f.w}
              height={f.h}
              rx="3"
              fill={fill(f.id, available, selected)}
              stroke="var(--color-bg)"
              strokeWidth="2"
              role="button"
              tabIndex={0}
              aria-label={sectionName(f.id, lang)}
              onClick={() => onPick(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(f.id);
                }
              }}
              onMouseEnter={() => setHover(f.id)}
              onMouseLeave={() => setHover(null)}
            />
            <text x={f.x + f.w / 2} y={f.y + 20} textAnchor="middle" fontSize="8" fontWeight="700" fill={ink(f.id, available)} pointerEvents="none">
              {f.id}
            </text>
          </g>
        ))}
      </svg>
    </MapFrame>
  );
}

function Theater(props: Props & { hover: string | null; setHover: (id: string | null) => void }) {
  const rows = [
    [
      { id: "OL", x: 40, w: 100 },
      { id: "OC", x: 148, w: 104 },
      { id: "OR", x: 260, w: 100 },
    ],
    [
      { id: "ML", x: 40, w: 100 },
      { id: "MC", x: 148, w: 104 },
      { id: "MR", x: 260, w: 100 },
    ],
  ];
  return (
    <MapFrame {...props}>
      <svg viewBox="0 0 400 360" className="h-auto w-full">
        <rect x="90" y="16" width="220" height="28" rx="4" fill="var(--color-fg)" />
        <text x="200" y="35" textAnchor="middle" fill="var(--color-bg)" fontSize="11" fontWeight="700">
          {props.label}
        </text>
        {rows[0]?.map((r) => (
          <Block key={r.id} {...props} id={r.id} x={r.x} y={70} w={r.w} h={52} />
        ))}
        {rows[1]?.map((r) => (
          <Block key={r.id} {...props} id={r.id} x={r.x} y={132} w={r.w} h={48} />
        ))}
        <Block {...props} id="BAL" x={70} y={192} w={260} h={44} />
        <Block {...props} id="BX" x={40} y={250} w={320} h={40} />
      </svg>
    </MapFrame>
  );
}

function Club(props: Props & { hover: string | null; setHover: (id: string | null) => void }) {
  const tables = POOLS.club.filter((s) => s.id.startsWith("T"));
  return (
    <MapFrame {...props}>
      <svg viewBox="0 0 400 360" className="h-auto w-full">
        <rect x="70" y="16" width="260" height="36" rx="4" fill="var(--color-fg)" />
        <text x="200" y="39" textAnchor="middle" fill="var(--color-bg)" fontSize="11" fontWeight="700">
          {props.label}
        </text>
        {tables.map((t, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return <Block key={t.id} {...props} id={t.id} x={48 + col * 80} y={80 + row * 78} w={68} h={60} />;
        })}
        <Block {...props} id="GA" x={48} y={250} w={304} h={44} />
      </svg>
    </MapFrame>
  );
}

function Block(
  props: Props & { hover: string | null; setHover: (id: string | null) => void; id: string; x: number; y: number; w: number; h: number },
) {
  return (
    <g>
      <rect
        x={props.x}
        y={props.y}
        width={props.w}
        height={props.h}
        rx="6"
        fill={fill(props.id, props.available, props.selected)}
        role="button"
        tabIndex={0}
        aria-label={sectionName(props.id, props.lang)}
        onClick={() => props.onPick(props.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            props.onPick(props.id);
          }
        }}
        onMouseEnter={() => props.setHover(props.id)}
        onMouseLeave={() => props.setHover(null)}
      />
      <text
        x={props.x + props.w / 2}
        y={props.y + props.h / 2 + 4}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill={ink(props.id, props.available)}
        pointerEvents="none"
      >
        {props.id}
      </text>
    </g>
  );
}

function MapFrame({
  children,
  hover,
  prices,
  currency,
  lang,
}: {
  children: ReactNode;
  hover: string | null;
  prices: Record<string, number>;
  currency: Currency;
  lang: Lang;
  label?: string;
}) {
  const price = hover ? prices[hover] : undefined;
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      {children}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-3 w-3 rounded-sm bg-blue" /> {lang === "es" ? "Disponible" : "Available"}
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-3 w-3 rounded-sm bg-map-off" /> {lang === "es" ? "Sin filtro" : "Filtered out"}
        </span>
        <span className="ml-auto min-h-4 font-semibold text-fg">
          {hover ? `${sectionName(hover, lang)}${price ? ` · ${money(price, currency, lang)}` : ""}` : ""}
        </span>
      </div>
    </div>
  );
}
