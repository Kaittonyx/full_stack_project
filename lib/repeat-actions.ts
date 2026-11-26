"use server";

import { redirect } from "next/navigation";
import { addToCart } from "@/lib/cart-actions";
import { products } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { addons, doughNames, MAX_LINE_QTY } from "@/lib/menu";
import { getOrders } from "@/lib/orders";
import type { OrderItem } from "@/lib/types";

function parseDetails(details?: string) {
    const parts = (details ?? "").split("; ");
    const dough = doughNames.find((d) => parts.includes(`${d} тесто`));
    const extrasPart = parts.find((p) => p.startsWith("+ "));
    const removedPart = parts.find((p) => p.startsWith("без: "));

    const extras = extrasPart
        ? extrasPart.slice(2).split(", ").filter((n) => addons.some((a) => a.name === n))
        : [];
    const removed = removedPart ? removedPart.slice(5).split(", ") : [];

    return { dough, extras, removed };
}

async function addItem(item: OrderItem): Promise<boolean> {
    const product = products.find((p) => p.name === item.name);
    if (!product || !product.isAvailable) return false;

    const { dough, extras, removed } = parseDetails(item.details);
    const qty = Math.min(Math.max(item.quantity, 1), MAX_LINE_QTY);

    let added = false;
    for (let i = 0; i < qty; i++) {
        const res = await addToCart({ productId: product.id, size: item.size, dough, extras, removed });
        if (!res.ok) return added;
        added = true;
    }
    return added;
}

async function myOrder(orderId: string) {
    const { role, user } = await getSession();
    if (role !== "customer" || !user) return null;
    return getOrders().find((o) => o.id === orderId && o.customerId === user.id) ?? null;
}

export async function repeatOrder(formData: FormData) {
    const order = await myOrder(String(formData.get("orderId") ?? ""));
    if (!order) return;

    let added = 0;
    let skipped = 0;
    for (const item of order.items) {
        if (await addItem(item)) added += 1;
        else skipped += 1;
    }
    redirect(`/orders?added=${added}&skipped=${skipped}`);
}

export async function repeatItem(formData: FormData) {
    const order = await myOrder(String(formData.get("orderId") ?? ""));
    if (!order) return;

    const item = order.items[Number(formData.get("index"))];
    if (!item) return;

    const ok = await addItem(item);
    redirect(`/orders?added=${ok ? 1 : 0}&skipped=${ok ? 0 : 1}`);
}