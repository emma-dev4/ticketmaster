import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Currency, Market } from "@/data/catalog";
import type { Lang } from "@/lib/format";
import type { Listing, OfferType, Tier } from "@/lib/offers";

export type User = { name: string; email: string };
export type Account = User & { password: string };

export type CartLine = {
  eventId: string;
  offerId: string;
  qty: number;
  section: string;
  row: string;
  seats: number[];
  face: number;
  type: OfferType;
  tier: Tier;
  currency: Currency;
  expires: number;
};

export type Order = {
  id: string;
  createdAt: string;
  email: string;
  buyer: string;
  eventId: string;
  section: string;
  row: string;
  seats: number[];
  face: number;
  type: OfferType;
  tier: Tier;
  currency: Currency;
  serviceEach: number;
  facilityEach: number;
  processing: number;
  total: number;
  last4: string;
  status: "confirmed" | "listed" | "sold" | "transferred";
  listPrice?: number;
  transferEmail?: string;
};

type State = {
  lang: Lang;
  market: Market;
  city: string;
  user: User | null;
  accounts: Account[];
  watch: string[];
  favArtists: string[];
  unlocked: string[];
  cart: CartLine | null;
  orders: Order[];
  listings: Listing[];
  sold: string[];
  authOpen: boolean;
  authMode: "in" | "up";
  locOpen: boolean;
  pendingCheckout: boolean;
  hydrated: boolean;
  setLang: (lang: Lang) => void;
  setMarket: (market: Market) => void;
  setCity: (city: string) => void;
  openAuth: (mode?: "in" | "up") => void;
  closeAuth: () => void;
  openLoc: () => void;
  closeLoc: () => void;
  signIn: (email: string, password: string) => "ok" | "bad" | "short";
  signUp: (name: string, email: string, password: string) => "ok" | "exists" | "short" | "required";
  demoIn: () => void;
  signOut: () => void;
  toggleWatch: (id: string) => boolean;
  toggleFav: (slug: string) => boolean;
  unlock: (id: string) => void;
  setCart: (cart: CartLine) => void;
  clearCart: () => void;
  placeOrder: (last4: string) => Order | null;
  listOrder: (orderId: string, price: number) => boolean;
  cancelList: (orderId: string) => void;
  transfer: (orderId: string, email: string) => void;
  setPending: (v: boolean) => void;
  markHydrated: () => void;
};

const memory = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      lang: "en",
      market: "us",
      city: "New York",
      user: null,
      accounts: [],
      watch: [],
      favArtists: [],
      unlocked: [],
      cart: null,
      orders: [],
      listings: [],
      sold: [],
      authOpen: false,
      authMode: "in",
      locOpen: false,
      pendingCheckout: false,
      hydrated: false,
      setLang: (lang) => set({ lang }),
      setMarket: (market) =>
        set({
          market,
          lang: market === "es" ? "es" : "en",
          city: market === "es" ? "Madrid" : "New York",
        }),
      setCity: (city) => set({ city, locOpen: false }),
      openAuth: (mode = "in") => set({ authOpen: true, authMode: mode }),
      closeAuth: () => set({ authOpen: false }),
      openLoc: () => set({ locOpen: true }),
      closeLoc: () => set({ locOpen: false }),
      signIn: (email, password) => {
        const e = email.trim().toLowerCase();
        if (password.length < 4) return "short";
        const acc = get().accounts.find((a) => a.email === e);
        if (!acc || acc.password !== password) return "bad";
        set({ user: { name: acc.name, email: acc.email }, authOpen: false });
        return "ok";
      },
      signUp: (name, email, password) => {
        const n = name.trim();
        const e = email.trim().toLowerCase();
        if (!n || !e || !password) return "required";
        if (password.length < 4) return "short";
        if (get().accounts.some((a) => a.email === e)) return "exists";
        const user = { name: n, email: e };
        set({ accounts: [...get().accounts, { ...user, password }], user, authOpen: false });
        return "ok";
      },
      demoIn: () => {
        const email = "alex.rivera@email.com";
        const existing = get().accounts.find((a) => a.email === email);
        const acc = existing ?? { name: "Alex Rivera", email, password: "demo" };
        set({
          accounts: existing ? get().accounts : [...get().accounts, acc],
          user: { name: acc.name, email: acc.email },
          authOpen: false,
        });
      },
      signOut: () => set({ user: null }),
      toggleWatch: (id) => {
        const has = get().watch.includes(id);
        set({ watch: has ? get().watch.filter((x) => x !== id) : [...get().watch, id] });
        return !has;
      },
      toggleFav: (slug) => {
        const has = get().favArtists.includes(slug);
        set({
          favArtists: has ? get().favArtists.filter((x) => x !== slug) : [...get().favArtists, slug],
        });
        return !has;
      },
      unlock: (id) => {
        if (!get().unlocked.includes(id)) set({ unlocked: [...get().unlocked, id] });
      },
      setCart: (cart) => set({ cart }),
      clearCart: () => set({ cart: null, pendingCheckout: false }),
      placeOrder: (last4) => {
        const cart = get().cart;
        const user = get().user;
        if (!cart || !user) return null;
        if (Date.now() > cart.expires) {
          set({ cart: null });
          return null;
        }
        const order: Order = {
          id: String(100000000 + Math.floor(Math.random() * 899999999)),
          createdAt: new Date().toISOString(),
          email: user.email,
          buyer: user.name,
          eventId: cart.eventId,
          section: cart.section,
          row: cart.row,
          seats: cart.seats,
          face: cart.face,
          type: cart.type,
          tier: cart.tier,
          currency: cart.currency,
          serviceEach: 0,
          facilityEach: 0,
          processing: 0,
          total: 0,
          last4: "FREE",
          status: "confirmed",
        };
        const listing = get().listings.find((l) => l.id === cart.offerId);
        set({
          orders: [
            order,
            ...get().orders.map((o) => (listing && o.id === listing.orderId ? { ...o, status: "sold" as const } : o)),
          ],
          sold: [...get().sold, cart.offerId],
          listings: get().listings.filter((l) => l.id !== cart.offerId),
          cart: null,
          pendingCheckout: false,
        });
        return order;
      },
      listOrder: (orderId, price) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status !== "confirmed" || price <= 0) return false;
        const listing: Listing = {
          id: `fan-${orderId}`,
          orderId,
          eventId: order.eventId,
          section: order.section,
          row: order.row,
          seats: order.seats,
          price,
          tier: order.tier,
        };
        set({
          listings: [...get().listings.filter((l) => l.orderId !== orderId), listing],
          orders: get().orders.map((o) => (o.id === orderId ? { ...o, status: "listed", listPrice: price } : o)),
        });
        return true;
      },
      cancelList: (orderId) =>
        set({
          listings: get().listings.filter((l) => l.orderId !== orderId),
          orders: get().orders.map((o) => (o.id === orderId && o.status === "listed" ? { ...o, status: "confirmed", listPrice: undefined } : o)),
        }),
      transfer: (orderId, email) =>
        set({
          orders: get().orders.map((o) =>
            o.id === orderId && o.status === "confirmed" ? { ...o, status: "transferred", transferEmail: email.trim() } : o,
          ),
        }),
      setPending: (pendingCheckout) => set({ pendingCheckout }),
      markHydrated: () => {
        const g = get();
        const user = g.user ?? { name: "Alex Rivera", email: "alex.rivera@email.com" };
        const accounts = g.accounts.some((a) => a.email === user.email)
          ? g.accounts
          : [...g.accounts, { name: user.name, email: user.email, password: "demo" }];
        const orders =
          g.orders.length > 0
            ? g.orders
            : [
                {
                  id: "482910337",
                  createdAt: "2026-10-25T18:04:00.000Z",
                  email: user.email,
                  buyer: user.name,
                  eventId: "or-phi",
                  section: "102",
                  row: "12",
                  seats: [7, 8],
                  face: 149,
                  type: "standard" as const,
                  tier: "lower" as const,
                  currency: "USD" as const,
                  serviceEach: 0,
                  facilityEach: 0,
                  processing: 0,
                  total: 0,
                  last4: "FREE",
                  status: "confirmed" as const,
                },
              ];
        set({ user, accounts, orders, hydrated: true });
      },
    }),
    {
      name: "tm-fan",
      storage: createJSONStorage(() => (typeof window === "undefined" ? memory : localStorage)),
      skipHydration: true,
      partialize: (s) => ({
        lang: s.lang,
        market: s.market,
        city: s.city,
        user: s.user,
        accounts: s.accounts,
        watch: s.watch,
        favArtists: s.favArtists,
        unlocked: s.unlocked,
        cart: s.cart,
        orders: s.orders,
        listings: s.listings,
        sold: s.sold,
      }),
    },
  ),
);
