import { translate } from "@/data/i18n";
import type { Lang } from "@/lib/format";
import { useApp } from "@/lib/store";

export function useT() {
  const lang = useApp((s) => s.lang);
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  return { lang, t };
}

export type { Lang };
