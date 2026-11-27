import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";
import AutoRefresh from "@/components/AutoRefresh";
import FilterBar, { type FilterField } from "@/components/FilterBar";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { getUser, orderTotal, users } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { hrefWith, paginate, toQuery, type SP } from "@/lib/list-query";
import { paymentMethods } from "@/lib/menu";
import { managerAssignCourier, managerCancel } from "@/lib/order-actions";
import { filterOrders, parseOrderQuery, STATUS_LABELS } from "@/lib/order-filters";
import { getOrders, isFinal } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";
import type { OrderStatus } from "@/lib/types";

export const metadata = { title: "Заказы" };

const VIEWS = [
  { v: "", label: "Все" },
  { v: "today", label: "Сегодня" },
  { v: "active", label: "В работе" },
];

export default async function ManagerPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { role } = await getSession();
  if (!canAccess(role, "/manager")) {
    return <AccessDenied allowed={routeRoles["/manager"]} />;
  }

  const sp = await searchParams;
  const query = parseOrderQuery(sp);
  const current = toQuery(sp);

  const all = getOrders();
  const couriers = users.filter((u) => u.role === "courier");
  const filtered = filterOrders(all, query);
  const pageData = paginate(filtered, query.page, query.per);

  const counts = new Map<string, number>();
  for (const o of filterOrders(all, query, { ignoreStatus: true })) {
    counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
  }

  const fields: FilterField[] = [
    {
      type: "multi",
      name: "status",
      label: "Статус",
      options: (Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => ({
        value: s,
        label: STATUS_LABELS[s],
        count: counts.get(s) ?? 0,
      })),
    },
    { type: "daterange", from: "from", to: "to", label: "Дата заказа" },
    { type: "range", min: "min", max: "max", label: "Сумма", unit: "₸" },
    {
      type: "select",
      name: "courier",
      label: "Курьер",
      options: [{ value: "none", label: "Без курьера" }, ...couriers.map((c) => ({ value: c.id, label: c.name }))],
    },
    { type: "select", name: "payment", label: "Оплата", options: paymentMethods.map((m) => ({ value: m, label: m })) },
  ];

  const activeCount = all.filter((o) => !isFinal(o.status)).length;

  return (
    <>
      <AutoRefresh seconds={5} />
      <div className="page-head">
        <h1>Заказы</h1>
        <p className="muted">
          Всего: {all.length.toLocaleString("ru-RU")}, в работе: {activeCount}
        </p>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {VIEWS.map((t) => (
          <Link
            key={t.v}
            href={hrefWith("/manager", current, { view: t.v || null, page: null })}
            className={query.view === t.v ? "tab active" : "tab"}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <FilterBar
        fields={fields}
        searchPlaceholder="Номер, клиент, телефон, адрес или блюдо"
        sortOptions={[
          { value: "newest", label: "Сначала новые" },
          { value: "oldest", label: "Сначала старые" },
          { value: "sum-desc", label: "Сначала дорогие" },
          { value: "sum-asc", label: "Сначала дешёвые" },
        ]}
        found={filtered.length}
        total={all.length}
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Заказ</th>
              <th>Время</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Курьер</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pageData.items.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  {all.length === 0 ? (
                    "Заказов пока нет"
                  ) : (
                    <>
                      По этим условиям заказов не найдено.{" "}
                      <Link href={query.view ? `/manager?view=${query.view}` : "/manager"} className="dish-link">
                        Сбросить фильтры
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            )}
            {pageData.items.map((o) => {
              const customer = getUser(o.customerId);
              const canReassign = o.status === "READY" || o.status === "ASSIGNED_TO_COURIER";
              return (
                <tr key={o.id}>
                  <td>
                    <strong>{o.number}</strong>
                  </td>
                  <td>
                    {formatDate(o.createdAt)}, {formatTime(o.createdAt)}
                  </td>
                  <td>
                    {customer?.name}
                    {customer?.phone && <div className="small muted">{customer.phone}</div>}
                  </td>
                  <td>{formatPrice(orderTotal(o))}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td>
                    {canReassign ? (
                      <form action={managerAssignCourier} className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
                        <input type="hidden" name="id" value={o.id} />
                        <select className="select" name="courierId" defaultValue={o.courierId ?? ""} aria-label="Курьер">
                          <option value="" disabled>
                            Выбрать…
                          </option>
                          {couriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn-ghost btn-sm">
                          {o.courierId ? "Сменить" : "Назначить"}
                        </button>
                      </form>
                    ) : o.courierId ? (
                      getUser(o.courierId)?.name
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="right">
                    <div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                      <OrderDetailsModal order={o} />
                      {!isFinal(o.status) && (
                        <form action={managerCancel}>
                          <input type="hidden" name="id" value={o.id} />
                          <button type="submit" className="btn btn-ghost btn-sm">
                            Отменить
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination path="/manager" query={current} {...pageData} />
    </>
  );
}