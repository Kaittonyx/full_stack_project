import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { todayKey } from "./analytics";

const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "promos.json");

export interface Promo {
    code: string;
    kind: "percent" | "fixed";
    value: number;
    minSubtotal: number;
    firstOrderOnly: boolean;
    usageLimit: number;
    used: number;
    expiresAt?: string;
    isActive: boolean;
    createdAt: string;
}

const DEFAULTS: Promo[] = [
    {
        code: "WELCOME10",
        kind: "percent",
        value: 10,
        minSubtotal: 0,
        firstOrderOnly: true,
        usageLimit: 0,
        used: 0,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
        code: "FRIDAY500",
        kind: "fixed",
        value: 500,
        minSubtotal: 6000,
        firstOrderOnly: false,
        usageLimit: 0,
        used: 0,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
    },
];

function write(list: Promo[]) {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
}

function read(): Promo[] {
    try {
        if (!existsSync(FILE)) {
            write(DEFAULTS);
            return DEFAULTS;
        }
        return JSON.parse(readFileSync(FILE, "utf-8")) as Promo[];
    } catch {
        return DEFAULTS;
    }
}

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export function describePromo(p: Promo): string {
    const parts = [p.kind === "percent" ? `−${p.value}%` : `−${money(p.value)} ₸`];
    if (p.firstOrderOnly) parts.push("на первый заказ");
    if (p.minSubtotal > 0) parts.push(`при заказе от ${money(p.minSubtotal)} ₸`);
    return parts.join(" ");
}

export function getPromos(): Promo[] {
    return read();
}

export function findPromo(code: string): Promo | undefined {
    const needle = code.trim().toUpperCase();
    return read().find((p) => p.code === needle);
}

export function promoStatus(p: Promo): { label: string; tone: "green" | "gray" | "red"; active: boolean } {
    if (!p.isActive) return { label: "Отключён", tone: "gray", active: false };
    if (p.expiresAt && p.expiresAt < todayKey()) return { label: "Срок истёк", tone: "red", active: false };
    if (p.usageLimit > 0 && p.used >= p.usageLimit) return { label: "Лимит исчерпан", tone: "red", active: false };
    return { label: "Активен", tone: "green", active: true };
}

export function evaluatePromo(
    p: Promo,
    subtotal: number,
    hasPreviousOrders: boolean,
): { discount: number; error?: string } {
    if (!p.isActive) return { discount: 0, error: "Промокод больше не действует" };
    if (p.expiresAt && p.expiresAt < todayKey()) return { discount: 0, error: "Срок действия промокода истёк" };
    if (p.usageLimit > 0 && p.used >= p.usageLimit) return { discount: 0, error: "Лимит использований исчерпан" };
    if (p.firstOrderOnly && hasPreviousOrders) {
        return { discount: 0, error: "Промокод действует только на первый заказ" };
    }
    if (subtotal < p.minSubtotal) {
        return { discount: 0, error: `Промокод действует при заказе от ${money(p.minSubtotal)} ₸` };
    }
    const raw = p.kind === "percent" ? Math.round((subtotal * p.value) / 100) : p.value;
    return { discount: Math.min(raw, subtotal) };
}

export type PromoInput = {
    code: string;
    kind: "percent" | "fixed";
    value: number;
    minSubtotal: number;
    firstOrderOnly: boolean;
    usageLimit: number;
    expiresAt?: string;
};

export function createPromo(input: PromoInput): { ok: true } | { ok: false; error: string } {
    const code = input.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
        return { ok: false, error: "Код: от 3 до 20 символов, латинские буквы, цифры, - и _" };
    }
    if (read().some((p) => p.code === code)) return { ok: false, error: "Такой код уже есть" };

    const max = input.kind === "percent" ? 90 : 50000;
    if (!Number.isInteger(input.value) || input.value < 1 || input.value > max) {
        return { ok: false, error: `Размер скидки: целое число от 1 до ${money(max)}` };
    }
    if (!Number.isInteger(input.minSubtotal) || input.minSubtotal < 0 || input.minSubtotal > 1_000_000) {
        return { ok: false, error: "Минимальная сумма: целое число от 0" };
    }
    if (!Number.isInteger(input.usageLimit) || input.usageLimit < 0 || input.usageLimit > 100000) {
        return { ok: false, error: "Лимит использований: целое число от 0 (0 значит без лимита)" };
    }
    if (input.expiresAt && (!/^\d{4}-\d{2}-\d{2}$/.test(input.expiresAt) || input.expiresAt < todayKey())) {
        return { ok: false, error: "Дата окончания не может быть в прошлом" };
    }

    const list = read();
    list.push({
        code,
        kind: input.kind,
        value: input.value,
        minSubtotal: input.minSubtotal,
        firstOrderOnly: input.firstOrderOnly,
        usageLimit: input.usageLimit,
        used: 0,
        expiresAt: input.expiresAt,
        isActive: true,
        createdAt: new Date().toISOString(),
    });
    write(list);
    return { ok: true };
}

export function setPromoActive(code: string, active: boolean): void {
    const list = read();
    const promo = list.find((p) => p.code === code);
    if (!promo) return;
    promo.isActive = active;
    write(list);
}

export function deletePromo(code: string): void {
    write(read().filter((p) => p.code !== code));
}

export function registerPromoUse(code: string): void {
    const list = read();
    const promo = list.find((p) => p.code === code.trim().toUpperCase());
    if (!promo) return;
    promo.used += 1;
    write(list);
}