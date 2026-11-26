import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "reviews.json");

export interface Review {
    id: string;
    orderId: string;
    customerId: string;
    kind?: "dish" | "delivery";
    dish: string;
    courierId?: string | null;
    rating: number;
    comment: string;
    createdAt: string;
}

const isDish = (r: Review) => r.kind !== "delivery";

function read(): Review[] {
    try {
        if (!existsSync(FILE)) return [];
        return JSON.parse(readFileSync(FILE, "utf-8")) as Review[];
    } catch {
        return [];
    }
}

function write(list: Review[]) {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
}

export function getReviews(): Review[] {
    return read();
}

export function hasReviewForOrder(orderId: string): boolean {
    return read().some((r) => r.orderId === orderId);
}

export function addReviews(items: Omit<Review, "id" | "createdAt">[]): void {
    const list = read();
    const now = new Date().toISOString();
    items.forEach((item, i) => {
        list.push({ ...item, id: `r-${Date.now()}-${i}`, createdAt: now });
    });
    write(list);
}

export function ratingFor(dish: string): { avg: number; count: number } {
    const own = read().filter((r) => isDish(r) && r.dish === dish);
    if (own.length === 0) return { avg: 0, count: 0 };
    const sum = own.reduce((s, r) => s + r.rating, 0);
    return { avg: sum / own.length, count: own.length };
}

export type RatingsReport = {
    dishAvg: number;
    dishCount: number;
    deliveryAvg: number;
    deliveryCount: number;
    distribution: { star: number; count: number }[];
    topDishes: { name: string; avg: number; count: number }[];
    couriers: { name: string; avg: number; count: number }[];
    latest: {
        orderId: string;
        comment: string;
        createdAt: string;
        dishes: string;
        dishRating: number;
        deliveryRating: number;
    }[];
};

export function buildRatingsReport(courierName: (id: string) => string): RatingsReport {
    const all = read();
    const dishRows = all.filter(isDish);
    const deliveryRows = all.filter((r) => r.kind === "delivery");

    const avg = (rows: Review[]) =>
        rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: dishRows.filter((r) => r.rating === star).length,
    }));

    const byDish = new Map<string, Review[]>();
    for (const r of dishRows) byDish.set(r.dish, [...(byDish.get(r.dish) ?? []), r]);
    const topDishes = [...byDish.entries()]
        .map(([name, rows]) => ({ name, avg: avg(rows), count: rows.length }))
        .sort((a, b) => b.avg - a.avg || b.count - a.count)
        .slice(0, 5);

    const byCourier = new Map<string, Review[]>();
    for (const r of deliveryRows) {
        if (!r.courierId) continue;
        byCourier.set(r.courierId, [...(byCourier.get(r.courierId) ?? []), r]);
    }
    const couriers = [...byCourier.entries()]
        .map(([id, rows]) => ({ name: courierName(id), avg: avg(rows), count: rows.length }))
        .sort((a, b) => b.avg - a.avg);

    const byOrder = new Map<string, Review[]>();
    for (const r of all) byOrder.set(r.orderId, [...(byOrder.get(r.orderId) ?? []), r]);
    const latest = [...byOrder.values()]
        .map((rows) => {
            const dishes = rows.filter(isDish);
            return {
                orderId: rows[0].orderId,
                comment: rows.find((r) => r.comment)?.comment ?? "",
                createdAt: rows[0].createdAt,
                dishes: dishes.map((r) => r.dish).join(", "),
                dishRating: avg(dishes),
                deliveryRating: rows.find((r) => r.kind === "delivery")?.rating ?? 0,
            };
        })
        .filter((x) => x.comment)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5);

    return {
        dishAvg: avg(dishRows),
        dishCount: dishRows.length,
        deliveryAvg: avg(deliveryRows),
        deliveryCount: deliveryRows.length,
        distribution,
        topDishes,
        couriers,
        latest,
    };
}
export function getReviewsByOrder(orderId: string): Review[] {
    return read().filter((r) => r.orderId === orderId);
}