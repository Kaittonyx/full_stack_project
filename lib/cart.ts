// Корзина: хранение по cookie "cart_id" + серверный расчёт цен.
// Цены в корзине не хранятся — их всегда считает сервер по каталогу.

import { cookies } from "next/headers";
import { calcPrice, doughs, MAX_PER_INGREDIENT, MAX_TOTAL_PIECES, sizes } from "./builder";
import { ingredients, products } from "./data";
import {
  addons,
  DELIVERY_FEE,
  doughNames,
  FREE_DELIVERY_FROM,
  SIZE_STEP_PRICE,
} from "./menu";
import { readDb, type StoredCart } from "./store";
import type { CartItem, OrderItem, PizzaRecipeInput } from "./types";

const CART_COOKIE = "cart_id";

export async function getCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export async function getStoredCart(): Promise<StoredCart> {
  const id = await getCartId();
  if (!id) return { items: [] };
  return readDb((db) => db.carts[id] ?? { items: [] });
}

export async function getCartCount(): Promise<number> {
  const cart = await getStoredCart();
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}

// ===== Цена одной строки =====

export interface PricedLine {
  item: CartItem;
  name: string;
  size?: string;
  details?: string;
  unitPrice: number;
  image?: string;
  emoji: string;
}

export function priceItem(item: CartItem): PricedLine | null {
  if (item.kind === "custom") {
    if (!item.recipe || !isValidRecipe(item.recipe)) return null;
    const r = item.recipe;
    const byId = new Map(ingredients.map((i) => [i.id, i]));
    const details = [
      doughs.find((d) => d.id === r.doughId)?.name,
      r.sauceId ? byId.get(r.sauceId)?.name : undefined,
      ...r.cheeseIds.map((id) => byId.get(id)?.name),
      ...r.toppings.filter((t) => t.count > 0).map((t) => `${byId.get(t.ingredientId)?.name} ×${t.count} кусочков`),
    ]
      .filter(Boolean)
      .join(", ");
    return {
      item,
      name: "Своя пицца",
      size: `${r.size} см`,
      details,
      unitPrice: calcPrice(r, ingredients),
      emoji: "🎮",
    };
  }

  const product = products.find((p) => p.id === item.productId);
  if (!product || !product.isAvailable) return null;

  let unitPrice = product.price;
  if (product.sizes?.length) {
    const idx = product.sizes.indexOf(item.size ?? "");
    if (idx === -1) return null;
    unitPrice += idx * SIZE_STEP_PRICE;
  }
  const extras = (item.extras ?? []).flatMap((name) => {
    const a = addons.find((x) => x.name === name);
    return a ? [a] : [];
  });
  unitPrice += extras.reduce((sum, a) => sum + a.price, 0);

  const parts: string[] = [];
  if (item.dough && doughNames.includes(item.dough)) parts.push(`${item.dough} тесто`);
  if (extras.length) parts.push(`+ ${extras.map((a) => a.name).join(", ")}`);
  if (item.removed?.length) parts.push(`без: ${item.removed.join(", ")}`);

  return {
    item,
    name: product.name,
    size: product.sizes?.length ? item.size : undefined,
    details: parts.join("; ") || undefined,
    unitPrice,
    image: product.image,
    emoji: product.emoji,
  };
}

export function isValidRecipe(r: PizzaRecipeInput): boolean {
  if (!doughs.some((d) => d.id === r.doughId)) return false;
  if (!sizes.some((s) => s.value === r.size)) return false;
  const usable = new Map(ingredients.filter((i) => i.isAvailable).map((i) => [i.id, i]));
  if (r.sauceId && usable.get(r.sauceId)?.type !== "sauce") return false;
  if (new Set(r.cheeseIds).size !== r.cheeseIds.length) return false;
  if (!r.cheeseIds.every((id) => usable.get(id)?.type === "cheese")) return false;
  let total = 0;
  const seen = new Set<string>();
  for (const t of r.toppings) {
    const type = usable.get(t.ingredientId)?.type;
    if (type !== "meat" && type !== "vegetable") return false;
    if (seen.has(t.ingredientId)) return false;
    seen.add(t.ingredientId);
    if (!Number.isInteger(t.count) || t.count < 1 || t.count > MAX_PER_INGREDIENT) return false;
    total += t.count;
  }
  return total <= MAX_TOTAL_PIECES;
}

// ===== Итоги корзины =====

export const promoCodes: Record<string, { description: string }> = {
  WELCOME10: { description: "−10% на первый заказ" },
  FRIDAY500: { description: "−500 ₸ при заказе от 6 000 ₸" },
};

// Возвращает скидку в ₸ или причину, по которой код не подходит.
export function calcDiscount(
  code: string | undefined,
  subtotal: number,
  hasPreviousOrders: boolean,
): { discount: number; error?: string } {
  if (!code) return { discount: 0 };
  if (code === "WELCOME10") {
    if (hasPreviousOrders) return { discount: 0, error: "Промокод действует только на первый заказ" };
    return { discount: Math.round(subtotal * 0.1) };
  }
  if (code === "FRIDAY500") {
    if (subtotal < 6000) return { discount: 0, error: "Промокод действует при заказе от 6 000 ₸" };
    return { discount: 500 };
  }
  return { discount: 0, error: "Такого промокода нет" };
}

export interface CartSummary {
  lines: PricedLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  promo?: string;
  promoError?: string;
  total: number;
}

export function summarize(cart: StoredCart, hasPreviousOrders: boolean): CartSummary {
  const lines = cart.items.flatMap((i) => {
    const l = priceItem(i);
    return l ? [l] : [];
  });
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.item.quantity, 0);
  const { discount, error } = calcDiscount(cart.promo, subtotal, hasPreviousOrders);
  const afterDiscount = subtotal - discount;
  const deliveryFee = lines.length === 0 || afterDiscount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return {
    lines,
    subtotal,
    deliveryFee,
    discount,
    promo: cart.promo,
    promoError: error,
    total: afterDiscount + deliveryFee,
  };
}

export function toOrderItems(lines: PricedLine[]): OrderItem[] {
  return lines.map((l) => ({
    name: l.name,
    size: l.size,
    details: l.details,
    quantity: l.item.quantity,
    unitPrice: l.unitPrice,
  }));
}
