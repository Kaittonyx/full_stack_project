"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getCartId,
  getStoredCart,
  summarize,
  toOrderItems,
} from "./cart";
import { getSession } from "./demo-session";
import { paymentMethods } from "./menu";
import {
  assignCourier as assignCourierDb,
  cancel,
  createOrder,
  deliver,
  finishCooking,
  getOrdersByCourier,
  getOrdersByCustomer,
  hasPreviousOrders,
  pickUp,
  startCooking,
  takeOrder as takeOrderDb,
  type OrderResult,
} from "./orders";
import type { Role } from "./permissions";
import { mutateDb } from "./store";

function refresh() {
  revalidatePath("/", "layout");
}

async function requireRole(allowed: Role[]) {
  const { role, user } = await getSession();
  if (!user || !allowed.includes(role)) return null;
  return user;
}

function idOf(formData: FormData): string {
  return String(formData.get("id") ?? "");
}

function finish(_result: OrderResult) {
  // Ошибки (например, заказ уже взят другим) молча игнорируем: страница обновится
  // и покажет актуальное состояние.
  refresh();
}

// ===== Клиент =====

export interface CheckoutState {
  error?: string;
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireRole(["customer"]);
  if (!user) return { error: "Оформлять заказы могут только клиенты. Войдите как клиент." };

  const address = String(formData.get("address") ?? "").trim();
  const addressComment = String(formData.get("addressComment") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "");

  if (address.length < 5) return { error: "Укажите адрес доставки" };
  if (!paymentMethods.includes(paymentMethod)) return { error: "Выберите способ оплаты" };
  if (address.length > 200 || addressComment.length > 200 || comment.length > 300) {
    return { error: "Слишком длинный текст в одном из полей" };
  }

  const cart = await getStoredCart();
  const summary = summarize(cart, hasPreviousOrders(user.id));
  if (summary.lines.length === 0) return { error: "Корзина пуста или товары больше недоступны" };
  if (summary.promoError) return { error: `Промокод: ${summary.promoError}. Уберите его в корзине.` };

  createOrder({
    customerId: user.id,
    items: toOrderItems(summary.lines),
    deliveryFee: summary.deliveryFee,
    discount: summary.discount,
    paymentMethod,
    address,
    addressComment,
    comment,
  });

  const cartId = await getCartId();
  if (cartId) {
    mutateDb((db) => {
      delete db.carts[cartId];
    });
  }
  refresh();
  redirect("/orders?placed=1");
}

export async function cancelMyOrder(formData: FormData) {
  const user = await requireRole(["customer"]);
  if (!user) return;
  const id = idOf(formData);
  // Клиент может отменить только свой заказ и только пока кухня его не взяла
  const mine = getOrdersByCustomer(user.id).some((o) => o.id === id);
  if (!mine) return;
  finish(cancel(id, user.id, ["PENDING", "CONFIRMED"]));
}

// ===== Кухня =====

export async function kitchenStart(formData: FormData) {
  const user = await requireRole(["cook", "manager", "admin"]);
  if (!user) return;
  finish(startCooking(idOf(formData), user.id));
}

export async function kitchenFinish(formData: FormData) {
  const user = await requireRole(["cook", "manager", "admin"]);
  if (!user) return;
  finish(finishCooking(idOf(formData), user.id));
}

// ===== Курьер =====

export async function courierTake(formData: FormData) {
  const user = await requireRole(["courier"]);
  if (!user) return;
  finish(takeOrderDb(idOf(formData), user.id));
}

async function ownsOrder(userId: string, role: Role, orderId: string) {
  if (role !== "courier") return true; // менеджер и админ могут двигать любой заказ
  return getOrdersByCourier(userId).some((o) => o.id === orderId);
}

export async function courierPickUp(formData: FormData) {
  const user = await requireRole(["courier", "manager", "admin"]);
  if (!user) return;
  const { role } = await getSession();
  if (!(await ownsOrder(user.id, role, idOf(formData)))) return;
  finish(pickUp(idOf(formData), user.id));
}

export async function courierDeliver(formData: FormData) {
  const user = await requireRole(["courier", "manager", "admin"]);
  if (!user) return;
  const { role } = await getSession();
  if (!(await ownsOrder(user.id, role, idOf(formData)))) return;
  finish(deliver(idOf(formData), user.id));
}

// ===== Менеджер / админ =====

export async function managerAssignCourier(formData: FormData) {
  const user = await requireRole(["manager", "admin"]);
  if (!user) return;
  finish(assignCourierDb(idOf(formData), String(formData.get("courierId") ?? ""), user.id));
}

export async function managerCancel(formData: FormData) {
  const user = await requireRole(["manager", "admin"]);
  if (!user) return;
  finish(cancel(idOf(formData), user.id));
}
