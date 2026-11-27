import { dayKeyOf, todayKey } from "./analytics";
import { getUser, orderTotal } from "./data";
import { list, num, str, type SP } from "./list-query";
import { isFinal } from "./orders";
import type { Order, OrderStatus } from "./types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Новый",
  PREPARING: "Готовится",
  READY: "Готов",
  ASSIGNED_TO_COURIER: "Курьер назначен",
  OUT_FOR_DELIVERY: "В пути",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

export type OrderQuery = {
  q: string;
  view: string;
  status: string[];
  from: string;
  to: string;
  min?: number;
  max?: number;
  courier: string;
  payment: string;
  sort: string;
  page?: number;
  per?: number;
};

const isDate = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "");

export function parseOrderQuery(sp: SP): OrderQuery {
  let from = isDate(str(sp, "from"));
  let to = isDate(str(sp, "to"));
  if (from && to && from > to) [from, to] = [to, from];

  return {
    q: str(sp, "q").slice(0, 100),
    view: str(sp, "view"),
    status: list(sp, "status"),
    from,
    to,
    min: num(sp, "min"),
    max: num(sp, "max"),
    courier: str(sp, "courier"),
    payment: str(sp, "payment"),
    sort: str(sp, "sort") || "newest",
    page: num(sp, "page"),
    per: num(sp, "per"),
  };
}

const norm = (s: string) => s.toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
const digits = (s: string) => s.replace(/\D/g, "");

export function filterOrders(all: Order[], q: OrderQuery, opts: { ignoreStatus?: boolean } = {}): Order[] {
  const today = todayKey();
  const words = norm(q.q).split(" ").filter(Boolean);

  const result = all.filter((o) => {
    const day = dayKeyOf(o.createdAt);
    if (q.view === "today" && day !== today) return false;
    if (q.view === "active" && isFinal(o.status)) return false;
    if (!opts.ignoreStatus && q.status.length && !q.status.includes(o.status)) return false;
    if (q.from && day < q.from) return false;
    if (q.to && day > q.to) return false;

    const total = orderTotal(o);
    if (q.min !== undefined && total < q.min) return false;
    if (q.max !== undefined && total > q.max) return false;

    if (q.courier === "none" && o.courierId) return false;
    if (q.courier && q.courier !== "none" && o.courierId !== q.courier) return false;
    if (q.payment && o.paymentMethod !== q.payment) return false;

    if (words.length) {
      const customer = getUser(o.customerId);
      const hay = norm(
        [o.number, customer?.name, customer?.phone, o.address, o.comment, ...o.items.map((i) => i.name)]
          .filter(Boolean)
          .join(" "),
      );
      const phone = digits(customer?.phone ?? "");
      const ok = words.every((w) => {
        const wd = digits(w);
        return hay.includes(w) || (wd.length >= 3 && phone.includes(wd));
      });
      if (!ok) return false;
    }
    return true;
  });

  return result.sort((a, b) => {
    if (q.sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
    if (q.sort === "sum-desc") return orderTotal(b) - orderTotal(a);
    if (q.sort === "sum-asc") return orderTotal(a) - orderTotal(b);
    return b.createdAt.localeCompare(a.createdAt);
  });
}