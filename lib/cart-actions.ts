"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { calcDiscount, getCartId, isValidRecipe, promoCodes, priceItem } from "./cart";
import { products } from "./data";
import { getSession } from "./demo-session";
import { addons, doughNames, MAX_LINE_QTY } from "./menu";
import { hasPreviousOrders } from "./orders";
import { mutateDb, readDb } from "./store";
import type { CartItem, PizzaRecipeInput } from "./types";

async function ensureCartId(): Promise<string> {
  const existing = await getCartId();
  if (existing) return existing;
  const id = randomUUID();
  const store = await cookies();
  store.set("cart_id", id, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", httpOnly: true });
  return id;
}

function done() {
  revalidatePath("/", "layout");
}

function sanitizeNames(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 40)).slice(0, 20);
}

function addLine(cartId: string, line: CartItem) {
  mutateDb((db) => {
    const cart = (db.carts[cartId] ??= { items: [] });
    const same = cart.items.find((i) => i.key === line.key);
    if (same) same.quantity = Math.min(same.quantity + line.quantity, MAX_LINE_QTY);
    else cart.items.push(line);
  });
}

export async function addToCart(input: {
  productId: string;
  size?: string;
  dough?: string;
  extras?: string[];
  removed?: string[];
}): Promise<{ ok: boolean }> {
  const product = products.find((p) => p.id === input.productId);
  if (!product || !product.isAvailable) return { ok: false };

  const hasSizes = Boolean(product.sizes?.length);
  const size = hasSizes ? input.size : undefined;
  if (hasSizes && !product.sizes?.includes(size ?? "")) return { ok: false };

  const dough = hasSizes && input.dough && doughNames.includes(input.dough) ? input.dough : undefined;
  const extras = hasSizes
    ? sanitizeNames(input.extras).filter((n) => addons.some((a) => a.name === n)).sort()
    : [];
  const removed = hasSizes ? sanitizeNames(input.removed).sort() : [];

  const key = [product.id, size ?? "", dough ?? "", extras.join("+"), removed.join("+")].join("|");
  addLine(await ensureCartId(), {
    key,
    kind: "product",
    productId: product.id,
    size,
    dough,
    extras,
    removed,
    quantity: 1,
  });
  done();
  return { ok: true };
}

export async function addCustomPizza(recipe: PizzaRecipeInput): Promise<{ ok: boolean; price?: number }> {
  const clean: PizzaRecipeInput = {
    doughId: String(recipe.doughId),
    size: Number(recipe.size),
    sauceId: recipe.sauceId ? String(recipe.sauceId) : null,
    cheeseIds: (recipe.cheeseIds ?? []).map(String),
    toppings: (recipe.toppings ?? []).map((t) => ({ ingredientId: String(t.ingredientId), count: Number(t.count) })),
  };
  if (!isValidRecipe(clean)) return { ok: false };

  const item: CartItem = { key: `custom|${randomUUID()}`, kind: "custom", recipe: clean, quantity: 1 };
  const priced = priceItem(item);
  if (!priced) return { ok: false };

  addLine(await ensureCartId(), item);
  done();
  return { ok: true, price: priced.unitPrice };
}

export async function changeQuantity(formData: FormData) {
  const id = await getCartId();
  if (!id) return;
  const key = String(formData.get("key"));
  const delta = Number(formData.get("delta")) > 0 ? 1 : -1;
  mutateDb((db) => {
    const cart = db.carts[id];
    if (!cart) return;
    const line = cart.items.find((i) => i.key === key);
    if (!line) return;
    line.quantity = Math.min(line.quantity + delta, MAX_LINE_QTY);
    if (line.quantity < 1) cart.items = cart.items.filter((i) => i.key !== key);
  });
  done();
}

export async function removeFromCart(formData: FormData) {
  const id = await getCartId();
  if (!id) return;
  const key = String(formData.get("key"));
  mutateDb((db) => {
    const cart = db.carts[id];
    if (cart) cart.items = cart.items.filter((i) => i.key !== key);
  });
  done();
}

export async function applyPromo(_prev: { message: string; ok: boolean }, formData: FormData) {
  const id = await getCartId();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!id) return { ok: false, message: "Корзина пуста" };
  if (!code) {
    mutateDb((db) => {
      if (db.carts[id]) delete db.carts[id].promo;
    });
    done();
    return { ok: true, message: "Промокод убран" };
  }
  if (!promoCodes[code]) return { ok: false, message: "Такого промокода нет" };

  const { user } = await getSession();
  const prev = user ? hasPreviousOrders(user.id) : false;
  const subtotal = readDb((db) => {
    const cart = db.carts[id];
    if (!cart) return 0;
    return cart.items.reduce((sum, i) => sum + (priceItem(i)?.unitPrice ?? 0) * i.quantity, 0);
  });
  const check = calcDiscount(code, subtotal, prev);
  if (check.error) return { ok: false, message: check.error };

  mutateDb((db) => {
    if (db.carts[id]) db.carts[id].promo = code;
  });
  done();
  return { ok: true, message: `Применён: ${promoCodes[code].description}` };
}
