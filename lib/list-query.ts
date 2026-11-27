export type SP = Record<string, string | string[] | undefined>;

export function str(sp: SP, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : (v ?? "")).trim();
}

export function num(sp: SP, key: string): number | undefined {
  const s = str(sp, key);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function list(sp: SP, key: string): string[] {
  const s = str(sp, key);
  return s ? s.split(",").filter(Boolean) : [];
}

export function toQuery(sp: SP): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s) out[k] = s;
  }
  return out;
}

export function hrefWith(
  path: string,
  current: Record<string, string>,
  changes: Record<string, string | null>,
): string {
  const p = new URLSearchParams(current);
  for (const [k, v] of Object.entries(changes)) {
    if (v) p.set(k, v);
    else p.delete(k);
  }
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}

export const PER_PAGE_OPTIONS = [25, 50, 100];

export function paginate<T>(items: T[], pageRaw?: number, perRaw?: number) {
  const per = PER_PAGE_OPTIONS.includes(perRaw ?? 0) ? (perRaw as number) : 25;
  const pages = Math.max(1, Math.ceil(items.length / per));
  const page = Math.min(Math.max(1, Math.floor(pageRaw ?? 1)), pages);
  const start = (page - 1) * per;
  return {
    items: items.slice(start, start + per),
    page,
    pages,
    per,
    total: items.length,
    from: items.length ? start + 1 : 0,
    to: Math.min(start + per, items.length),
  };
}