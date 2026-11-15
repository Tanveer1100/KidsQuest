import { countries, languages } from 'countries-list';

export type Option = { value: string; label: string; hint?: string };

export const COUNTRY_OPTIONS: Option[] = Object.entries(countries)
  .map(([code, c]) => ({
    value: code,
    label: c.name,
    hint: c.native && c.native !== c.name ? c.native : undefined,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const seen = new Set<string>();
export const LANGUAGE_OPTIONS: Option[] = Object.values(languages)
  .filter((l) => {
    if (!l.name || l.name.length < 2 || seen.has(l.name)) return false;
    seen.add(l.name);
    return true;
  })
  .map((l) => ({
    value: l.name,
    label: l.name,
    hint: l.native && l.native !== l.name ? l.native : undefined,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function countryName(code: string) {
  return (countries as Record<string, { name: string }>)[code]?.name ?? code;
}

export const AGE_BUCKETS = [
  { value: '3-5', label: '3 – 5' },
  { value: '6-8', label: '6 – 8' },
  { value: '9-12', label: '9 – 12' },
] as const;

export function ageLabel(v: string) {
  return AGE_BUCKETS.find((a) => a.value === v)?.label ?? v;
}

export function clerkMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  const e = err as { errors?: { longMessage?: string; message?: string }[]; longMessage?: string; message?: string };
  return e.errors?.[0]?.longMessage ?? e.errors?.[0]?.message ?? e.longMessage ?? e.message ?? fallback;
}
