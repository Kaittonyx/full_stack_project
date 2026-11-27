import { todayKey } from "./analytics";
import { prisma } from "./prisma";

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

type Row = Awaited<ReturnType<typeof prisma.promo.findMany>>[number];

function toPromo(row: Row): Promo {
    return {
        code: row.code,
        kind: row.kind === "fixed" ? "fixed" : "percent",
        value: row.value,
        minSubtotal: row.minSubtotal,
        firstOrderOnly: row.firstOrderOnly,
        usageLimit: row.usageLimit,
        used: row.used,
        expiresAt: row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : undefined,
        isActive: row.isActive,
        createdAt: row.createdAt.toISOString(),
    };
}

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export function describePromo(p: Promo): string {
    const parts = [p.kind === "percent" ? `−${p.value}%` : `−${money(p.value)} ₸`];
    if (p.firstOrderOnly) parts.push("на первый заказ");
    if (p.minSubtotal > 0) parts.push(`при заказе от ${money(p.minSubtotal)} ₸`);
    return parts.join(" ");
}

export async function getPromos(): Promise<Promo[]> {
    const rows = await prisma.promo.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toPromo);
}

export async function findPromo(code: string): Promise<Promo | undefined> {
    const row = await prisma.promo.findUnique({ where: { code: code.trim().toUpperCase() } });
    return row ? toPromo(row) : undefined;
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

export async function createPromo(input: PromoInput): Promise<{ ok: true } | { ok: false; error: string }> {
    const code = input.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
        return { ok: false, error: "Код: от 3 до 20 символов, латинские буквы, цифры, - и _" };
    }
    if (await prisma.promo.findUnique({ where: { code } })) return { ok: false, error: "Такой код уже есть" };

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

    await prisma.promo.create({
        data: {
            code,
            kind: input.kind,
            value: input.value,
            minSubtotal: input.minSubtotal,
            firstOrderOnly: input.firstOrderOnly,
            usageLimit: input.usageLimit,
            expiresAt: input.expiresAt ? new Date(`${input.expiresAt}T00:00:00.000Z`) : null,
        },
    });
    return { ok: true };
}

export async function setPromoActive(code: string, active: boolean): Promise<void> {
    await prisma.promo.updateMany({ where: { code }, data: { isActive: active } });
}

export async function deletePromo(code: string): Promise<void> {
    await prisma.promo.deleteMany({ where: { code } });
}

export async function registerPromoUse(code: string): Promise<void> {
    await prisma.promo.updateMany({
        where: { code: code.trim().toUpperCase() },
        data: { used: { increment: 1 } },
    });
}