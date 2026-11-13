// Жизненный цикл заказа. Здесь только бизнес-логика и работа с хранилищем,
// проверка ролей — в lib/order-actions.ts.
//
// CONFIRMED → PREPARING → (READY) → ASSIGNED_TO_COURIER → OUT_FOR_DELIVERY → DELIVERED
// Из любого не финального статуса можно уйти в CANCELLED.

import { users } from "./data";
import { mutateDb, readDb, type Db } from "./store";
import type { Order, OrderItem, OrderStatus } from "./types";

const FINAL: OrderStatus[] = ["DELIVERED", "CANCELLED"];
export const isFinal = (s: OrderStatus) => FINAL.includes(s);

const ACTIVE_DELIVERY: OrderStatus[] = ["ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY"];

// ===== Чтение =====

export function getOrders(): Order[] {
  return readDb((db) => [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function getOrdersByStatus(...statuses: OrderStatus[]): Order[] {
  // На кухне старые заказы выше: сортируем от старых к новым
  return getOrders()
    .filter((o) => statuses.includes(o.status))
    .reverse();
}

export function getOrdersByCustomer(customerId: string): Order[] {
  return getOrders().filter((o) => o.customerId === customerId);
}

export function getOrdersByCourier(courierId: string): Order[] {
  return getOrders().filter((o) => o.courierId === courierId);
}

export function hasPreviousOrders(customerId: string): boolean {
  return readDb((db) => db.orders.some((o) => o.customerId === customerId && o.status !== "CANCELLED"));
}

// ===== Создание =====

export interface NewOrderInput {
  customerId: string;
  items: OrderItem[];
  deliveryFee: number;
  discount: number;
  paymentMethod: string;
  address: string;
  addressComment: string;
  comment: string;
}

export function createOrder(input: NewOrderInput): Order {
  return mutateDb((db) => {
    db.counter += 1;
    const now = new Date().toISOString();
    // Оплата в демо условная, поэтому заказ сразу подтверждён и попадает на кухню
    const order: Order = {
      id: `o-${db.counter}`,
      number: `LP-${db.counter}`,
      status: "CONFIRMED",
      createdAt: now,
      courierId: null,
      history: [{ status: "CONFIRMED", at: now, by: input.customerId }],
      ...input,
    };
    db.orders.push(order);
    return order;
  });
}

// ===== Смена статуса =====

export type OrderResult = { ok: true; order: Order } | { ok: false; error: string };

function find(db: Db, id: string): Order | undefined {
  return db.orders.find((o) => o.id === id);
}

function setStatus(order: Order, status: OrderStatus, by: string) {
  const at = new Date().toISOString();
  order.status = status;
  (order.history ??= []).push({ status, at, by });
}

// Курьер с наименьшим числом активных доставок; при равенстве — первый в списке.
function pickCourier(db: Db): string | null {
  const couriers = users.filter((u) => u.role === "courier");
  if (couriers.length === 0) return null;
  const load = (id: string) =>
    db.orders.filter((o) => o.courierId === id && ACTIVE_DELIVERY.includes(o.status)).length;
  return couriers.reduce((best, c) => (load(c.id) < load(best.id) ? c : best)).id;
}

export function startCooking(id: string, by: string): OrderResult {
  return mutateDb((db) => {
    const o = find(db, id);
    if (!o) return { ok: false, error: "Заказ не найден" };
    if (o.status !== "CONFIRMED") return { ok: false, error: "Заказ уже в работе" };
    setStatus(o, "PREPARING", by);
    return { ok: true, order: o };
  });
}

// Заказ готов → сразу назначаем курьера. Если курьеров нет, заказ остаётся READY
// и его может взять курьер или назначить менеджер.
export function finishCooking(id: string, by: string): OrderResult {
  return mutateDb((db) => {
    const o = find(db, id);
    if (!o) return { ok: false, error: "Заказ не найден" };
    if (o.status !== "PREPARING") return { ok: false, error: "Заказ не на приготовлении" };
    setStatus(o, "READY", by);
    const courierId = pickCourier(db);
    if (courierId) {
      o.courierId = courierId;
      setStatus(o, "ASSIGNED_TO_COURIER", "system");
    }
    return { ok: true, order: o };
  });
}

// Назначить или переназначить курьера (пока заказ не забрали)
export function assignCourier(id: string, courierId: string, by: string): OrderResult {
  if (!users.some((u) => u.id === courierId && u.role === "courier")) {
    return { ok: false, error: "Курьер не найден" };
  }
  return mutateDb((db) => {
    const o = find(db, id);
    if (!o) return { ok: false, error: "Заказ не найден" };
    if (o.status !== "READY" && o.status !== "ASSIGNED_TO_COURIER") {
      return { ok: false, error: "Курьера можно назначить только готовому заказу до выезда" };
    }
    o.courierId = courierId;
    if (o.status === "READY") setStatus(o, "ASSIGNED_TO_COURIER", by);
    return { ok: true, order: o };
  });
}

// Курьер сам берёт заказ, который остался без курьера
export function takeOrder(id: string, courierId: string): OrderResult {
  return mutateDb((db) => {
    const o = find(db, id);
    if (!o) return { ok: false, error: "Заказ не найден" };
    if (o.status !== "READY" || o.courierId) return { ok: false, error: "Заказ уже взят" };
    o.courierId = courierId;
    setStatus(o, "ASSIGNED_TO_COURIER", courierId);
    return { ok: true, order: o };
  });
}

export function pickUp(id: string, by: string): OrderResult {
  return mutateDb((db) => {
    const o = find(db, id);
    if (!o) return { ok: false, error: "Заказ не найден" };
    if (o.status !== "ASSIGNED_TO_COURIER") return { ok: false, error: "Заказ не ожидает выезда" };
    setStatus(o, "OUT_FOR_DELIVERY", by);
    return { ok: true, order: o };
  });
}

export function deliver(id: string, by: string): OrderResult {
  return mutateDb((db) => {
    const o = find(db, id);
    if (!o) return { ok: false, error: "Заказ не найден" };
    if (o.status !== "OUT_FOR_DELIVERY") return { ok: false, error: "Заказ ещё не в пути" };
    setStatus(o, "DELIVERED", by);
    return { ok: true, order: o };
  });
}

// Отмена. allowedFrom ограничивает, из каких статусов можно отменять (клиент — только до кухни).
export function cancel(id: string, by: string, allowedFrom?: OrderStatus[]): OrderResult {
  return mutateDb((db) => {
    const o = find(db, id);
    if (!o) return { ok: false, error: "Заказ не найден" };
    if (isFinal(o.status)) return { ok: false, error: "Заказ уже завершён" };
    if (allowedFrom && !allowedFrom.includes(o.status)) {
      return { ok: false, error: "Заказ уже готовится, отменить нельзя" };
    }
    setStatus(o, "CANCELLED", by);
    return { ok: true, order: o };
  });
}
