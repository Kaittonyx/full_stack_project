import type { Order } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const UTC_OFFSET_HOURS = 5; // Астана
const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
export const MAX_RANGE_DAYS = 366;

export type FlatOrder = {
    createdAt: string;
    status: string;
    total: number;
    paymentMethod: string;
    items: { name: string; quantity: number; unitPrice: number }[];
};

export function toFlat(orders: Order[]): FlatOrder[] {
    return orders.map((o) => ({
        createdAt: o.createdAt,
        status: o.status,
        total: o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) + o.deliveryFee - o.discount,
        paymentMethod: o.paymentMethod,
        items: o.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
    }));
}

export type DayPoint = { key: string; label: string; full: string; revenue: number; orders: number };

export type SalesReport = {
    from: string;
    to: string;
    days: number;
    series: DayPoint[];
    revenue: number;
    orders: number;
    avgCheck: number;
    prevRevenue: number;
    prevOrders: number;
    cancelled: number;
    topDishes: { name: string; qty: number; revenue: number }[];
    byHour: number[];
    byPayment: { method: string; orders: number; revenue: number }[];
};

const keyFromTs = (ts: number) =>
    new Date(ts + UTC_OFFSET_HOURS * 60 * 60 * 1000).toISOString().slice(0, 10);
const tsFromKey = (key: string) => Date.parse(`${key}T00:00:00Z`);

export function todayKey(): string {
    return keyFromTs(Date.now());
}

export function addDays(key: string, n: number): string {
    return new Date(tsFromKey(key) + n * DAY_MS).toISOString().slice(0, 10);
}

export function lastDays(days: number): { from: string; to: string } {
    const to = todayKey();
    return { from: addDays(to, -(days - 1)), to };
}

export function monthToDate(): { from: string; to: string } {
    const to = todayKey();
    return { from: `${to.slice(0, 8)}01`, to };
}

export function normalizeRange(from: string, to: string): { from: string; to: string } {
    const ok = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(tsFromKey(s));
    if (!ok(from) || !ok(to)) return lastDays(7);
    if (from > to) [from, to] = [to, from];
    const span = Math.round((tsFromKey(to) - tsFromKey(from)) / DAY_MS) + 1;
    if (span > MAX_RANGE_DAYS) from = addDays(to, -(MAX_RANGE_DAYS - 1));
    return { from, to };
}

export function buildSalesReport(all: FlatOrder[], fromRaw: string, toRaw: string): SalesReport {
    const { from, to } = normalizeRange(fromRaw, toRaw);
    const days = Math.round((tsFromKey(to) - tsFromKey(from)) / DAY_MS) + 1;

    const keys = Array.from({ length: days }, (_, i) => addDays(from, i));
    const current = new Set(keys);
    const prevFrom = addDays(from, -days);
    const previous = new Set(Array.from({ length: days }, (_, i) => addDays(prevFrom, i)));

    const keyOf = (o: FlatOrder) => keyFromTs(new Date(o.createdAt).getTime());
    const inPeriod = all.filter((o) => current.has(keyOf(o)));
    const paid = inPeriod.filter((o) => o.status !== "CANCELLED");
    const prevPaid = all.filter((o) => o.status !== "CANCELLED" && previous.has(keyOf(o)));

    const series: DayPoint[] = keys.map((key) => {
        const day = paid.filter((o) => keyOf(o) === key);
        const dayName = DAY_NAMES[new Date(`${key}T12:00:00Z`).getUTCDay()];
        const short = `${key.slice(8, 10)}.${key.slice(5, 7)}`;
        return {
            key,
            label: days <= 7 ? dayName : short,
            full: `${dayName}, ${short}.${key.slice(0, 4)}`,
            revenue: day.reduce((sum, o) => sum + o.total, 0),
            orders: day.length,
        };
    });

    const revenue = series.reduce((sum, d) => sum + d.revenue, 0);

    const dishes = new Map<string, { qty: number; revenue: number }>();
    for (const o of paid) {
        for (const i of o.items) {
            const d = dishes.get(i.name) ?? { qty: 0, revenue: 0 };
            d.qty += i.quantity;
            d.revenue += i.quantity * i.unitPrice;
            dishes.set(i.name, d);
        }
    }
    const topDishes = [...dishes.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    const byHour = Array.from({ length: 24 }, () => 0);
    for (const o of paid) {
        const ts = new Date(o.createdAt).getTime() + UTC_OFFSET_HOURS * 60 * 60 * 1000;
        byHour[new Date(ts).getUTCHours()] += 1;
    }

    const payments = new Map<string, { orders: number; revenue: number }>();
    for (const o of paid) {
        const p = payments.get(o.paymentMethod) ?? { orders: 0, revenue: 0 };
        p.orders += 1;
        p.revenue += o.total;
        payments.set(o.paymentMethod, p);
    }

    return {
        from,
        to,
        days,
        series,
        revenue,
        orders: paid.length,
        avgCheck: paid.length ? Math.round(revenue / paid.length) : 0,
        prevRevenue: prevPaid.reduce((sum, o) => sum + o.total, 0),
        prevOrders: prevPaid.length,
        cancelled: inPeriod.length - paid.length,
        topDishes,
        byHour,
        byPayment: [...payments.entries()].map(([method, v]) => ({ method, ...v })),
    };
}
export function dayKeyOf(iso: string): string {
  return keyFromTs(new Date(iso).getTime());
}