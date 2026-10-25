import type { Currency, EventItem, VenueKind } from "@/data/catalog";

export type OfferType = "standard" | "resale" | "platinum" | "vip" | "accessible";
export type Tier =
  | "floor"
  | "lower"
  | "club"
  | "upper"
  | "orch"
  | "mezz"
  | "balc"
  | "box"
  | "table"
  | "ga"
  | "vip"
  | "ada";

export type Offer = {
  id: string;
  section: string;
  row: string;
  seatFrom: number;
  count: number;
  face: number;
  type: OfferType;
  tier: Tier;
  ada: boolean;
};

export type Listing = {
  id: string;
  orderId: string;
  eventId: string;
  section: string;
  row: string;
  seats: number[];
  price: number;
  tier: Tier;
};

export function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function feesFor(face: number, currency: Currency, type: OfferType) {
  if (type === "resale") return { service: 0, facility: 0, allIn: round(face) };
  const service = round(face * 0.175);
  const facility = currency === "USD" ? 4.95 : 3.5;
  return { service, facility, allIn: round(face + service + facility) };
}

export function processingFee(currency: Currency) {
  return currency === "USD" ? 2.95 : 2.5;
}

const MULT: Record<Tier, number> = {
  floor: 4.4,
  lower: 2.7,
  club: 1.75,
  upper: 1,
  orch: 3.1,
  mezz: 1.9,
  balc: 1.15,
  box: 3.4,
  table: 1.55,
  ga: 1,
  vip: 6.2,
  ada: 1.1,
};

export const RANK: Record<Tier, number> = {
  floor: 0,
  vip: 1,
  orch: 2,
  box: 3,
  lower: 4,
  club: 5,
  mezz: 6,
  table: 7,
  upper: 8,
  balc: 9,
  ga: 10,
  ada: 11,
};

export const POOLS: Record<VenueKind, { id: string; tier: Tier }[]> = {
  arena: [
    { id: "FL1", tier: "floor" },
    { id: "FL2", tier: "floor" },
    { id: "101", tier: "lower" },
    { id: "102", tier: "lower" },
    { id: "103", tier: "lower" },
    { id: "104", tier: "lower" },
    { id: "105", tier: "lower" },
    { id: "106", tier: "lower" },
    { id: "107", tier: "lower" },
    { id: "108", tier: "lower" },
    { id: "201", tier: "club" },
    { id: "202", tier: "club" },
    { id: "203", tier: "club" },
    { id: "204", tier: "club" },
    { id: "205", tier: "club" },
    { id: "206", tier: "club" },
    { id: "301", tier: "upper" },
    { id: "302", tier: "upper" },
    { id: "303", tier: "upper" },
    { id: "304", tier: "upper" },
    { id: "305", tier: "upper" },
    { id: "306", tier: "upper" },
    { id: "307", tier: "upper" },
    { id: "308", tier: "upper" },
    { id: "309", tier: "upper" },
    { id: "310", tier: "upper" },
  ],
  theater: [
    { id: "OL", tier: "orch" },
    { id: "OC", tier: "orch" },
    { id: "OR", tier: "orch" },
    { id: "ML", tier: "mezz" },
    { id: "MC", tier: "mezz" },
    { id: "MR", tier: "mezz" },
    { id: "BAL", tier: "balc" },
    { id: "BX", tier: "box" },
  ],
  club: [
    { id: "T1", tier: "table" },
    { id: "T2", tier: "table" },
    { id: "T3", tier: "table" },
    { id: "T4", tier: "table" },
    { id: "T5", tier: "table" },
    { id: "T6", tier: "table" },
    { id: "T7", tier: "table" },
    { id: "T8", tier: "table" },
    { id: "GA", tier: "ga" },
  ],
};

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const NAMES: Record<string, [string, string]> = {
  OL: ["Orchestra Left", "Orquesta izquierda"],
  OC: ["Orchestra Center", "Orquesta centro"],
  OR: ["Orchestra Right", "Orquesta derecha"],
  ML: ["Mezzanine Left", "Mezzanine izquierda"],
  MC: ["Mezzanine Center", "Mezzanine centro"],
  MR: ["Mezzanine Right", "Mezzanine derecha"],
  BAL: ["Balcony", "Anfiteatro"],
  BX: ["Boxes", "Palcos"],
  GA: ["General Admission", "Entrada general"],
  VIP: ["VIP Package", "Paquete VIP"],
  FL1: ["Floor 1", "Pista 1"],
  FL2: ["Floor 2", "Pista 2"],
};

export function sectionName(id: string, lang: "en" | "es") {
  const hit = NAMES[id];
  if (hit) return hit[lang === "es" ? 1 : 0];
  if (id.startsWith("T")) return lang === "es" ? `Mesa ${id.slice(1)}` : `Table ${id.slice(1)}`;
  return lang === "es" ? `Sección ${id}` : `Section ${id}`;
}

export function entryLevel(tier: Tier, lang: "en" | "es") {
  const en: Record<Tier, string> = {
    floor: "FLOOR",
    lower: "LOWER LEVEL",
    club: "CLUB LEVEL",
    upper: "UPPER LEVEL",
    orch: "ORCHESTRA",
    mezz: "MEZZANINE",
    balc: "BALCONY",
    box: "BOXES",
    table: "TABLE",
    ga: "GENERAL ADMISSION",
    vip: "VIP",
    ada: "ACCESSIBLE",
  };
  const es: Record<Tier, string> = {
    floor: "PISTA",
    lower: "GRADA BAJA",
    club: "CLUB",
    upper: "GRADA ALTA",
    orch: "ORQUESTA",
    mezz: "MEZZANINE",
    balc: "ANFITEATRO",
    box: "PALCOS",
    table: "MESA",
    ga: "ENTRADA GENERAL",
    vip: "VIP",
    ada: "ACCESIBLE",
  };
  return (lang === "es" ? es : en)[tier];
}

const cache = new Map<string, Offer[]>();

export function baseOffers(event: EventItem): Offer[] {
  const hit = cache.get(event.id);
  if (hit) return hit;
  const rand = rng(hash(event.id));
  const pool = POOLS[event.kind];
  const offers: Offer[] = [];
  let n = 0;
  const push = (section: string, tier: Tier, type: OfferType, multExtra = 1, ada = false) => {
    const face = round(Math.max(10, event.from * (MULT[tier] ?? 1) * multExtra * (0.94 + rand() * 0.18)));
    const letters = "ABCDEFGHJKLM";
    const row =
      tier === "upper" || tier === "balc" || tier === "ga"
        ? String(1 + Math.floor(rand() * 22))
        : letters[Math.floor(rand() * letters.length)] ?? "A";
    const count = tier === "ga" ? 4 + Math.floor(rand() * 5) : type === "vip" ? 2 : 1 + Math.floor(rand() * 6);
    offers.push({
      id: `${event.id}:${type}:${section}:${n++}`,
      section,
      row,
      seatFrom: 1 + Math.floor(rand() * 14),
      count,
      face,
      type,
      tier,
      ada,
    });
  };
  for (const sec of pool) {
    if (hash(event.id + ":" + sec.id) % 4 === 0) continue;
    push(sec.id, sec.tier, "standard");
    if (rand() > 0.78) push(sec.id, sec.tier, "standard");
  }
  if (!offers.length) {
    const sec = pool[0];
    if (sec) push(sec.id, sec.tier, "standard");
  }
  const standards = offers.filter((o) => o.type === "standard");
  const best = [...standards].sort((a, b) => RANK[a.tier] - RANK[b.tier])[0];
  const mid = standards[Math.min(2, standards.length - 1)];
  if (best) push(best.section, best.tier, "resale", 1.22);
  if (mid && mid !== best) push(mid.section, mid.tier, "resale", 1.15);
  if (best) {
    push(best.section, best.tier, "platinum", 1.48);
    push(best.section, best.tier, "platinum", 1.66);
  }
  push("VIP", "vip", "vip");
  const adaSec = pool.find((s) => s.tier === "upper" || s.tier === "balc" || s.tier === "ga") ?? pool[pool.length - 1];
  if (adaSec) push(adaSec.id, "ada", "accessible", 1, true);
  for (const o of offers) {
    if (o.type === "resale") o.face = feesFor(o.face, event.currency, "standard").allIn;
  }
  const cheap = offers
    .filter((o) => o.type === "standard")
    .sort((a, b) => feesFor(a.face, event.currency, a.type).allIn - feesFor(b.face, event.currency, b.type).allIn)[0];
  if (cheap) {
    const facility = event.currency === "USD" ? 4.95 : 3.5;
    cheap.face = round(Math.max(8, (event.from - facility) / 1.175));
  }
  cache.set(event.id, offers);
  return offers;
}

export function fromPrice(event: EventItem) {
  const nums = baseOffers(event)
    .filter((o) => o.type !== "vip")
    .map((o) => feesFor(o.face, event.currency, o.type).allIn);
  return nums.length ? Math.min(...nums) : event.from;
}

export function liveOffers(event: EventItem, sold: string[], listings: Listing[]): Offer[] {
  const base = baseOffers(event).filter((o) => !sold.includes(o.id));
  const extra: Offer[] = listings
    .filter((l) => l.eventId === event.id && !sold.includes(l.id))
    .map((l) => ({
      id: l.id,
      section: l.section,
      row: l.row,
      seatFrom: l.seats[0] ?? 1,
      count: Math.max(1, l.seats.length),
      face: l.price,
      type: "resale" as const,
      tier: l.tier,
      ada: false,
    }));
  return [...base, ...extra];
}
