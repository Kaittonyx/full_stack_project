import AccessDenied from "@/components/AccessDenied";
import AutoRefresh from "@/components/AutoRefresh";
import StatusBadge from "@/components/StatusBadge";
import { getUser, orderTotal, users } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { managerAssignCourier, managerCancel } from "@/lib/order-actions";
import { getOrders, isFinal } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";
import ListFilters from "@/components/ListFilters";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import SortSelect from "@/components/SortSelect";

// Все заказы: можно сменить курьера до выезда и отменить заказ.
type SearchParams = Promise<{ sort?: string }>;

export default async function ManagerPage({ searchParams }: { searchParams: SearchParams }) {
  const { sort } = await searchParams;
  const { role } = await getSession();

  if (!canAccess(role, "/manager")) {
    return <AccessDenied allowed={routeRoles["/manager"]} />;
  }

  const couriers = users.filter((u) => u.role === "courier");
  const orders = [...getOrders()].sort((a, b) => {
    if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
    if (sort === "sum-desc") return orderTotal(b) - orderTotal(a);
    if (sort === "sum-asc") return orderTotal(a) - orderTotal(b);
    return b.createdAt.localeCompare(a.createdAt);
  });
  const activeCount = orders.filter((o) => !isFinal(o.status)).length;

  return (
    <>
      <AutoRefresh seconds={5} />
      <div className="page-head">
        <h1>Заказы</h1>
        <p className="muted">
          Всего: {orders.length}, в работе: {activeCount}
        </p>
      </div>
      <SortSelect
          options={[
            { value: "newest", label: "Сначала новые" },
            { value: "oldest", label: "Сначала старые" },
            { value: "sum-desc", label: "Сначала дорогие" },
            { value: "sum-asc", label: "Сначала дешёвые" },
          ]}
      />
      <ListFilters options={[{ value: "active", label: "В работе" }, { value: "DELIVERED", label: "Доставлен" }, { value: "CANCELLED", label: "Отменён" }]}>
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
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Заказов пока нет
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const customer = getUser(o.customerId);
              const canReassign = o.status === "READY" || o.status === "ASSIGNED_TO_COURIER";
              return (
                <tr key={o.id} data-filter-item data-filter={isFinal(o.status) ? o.status : "active"}>
                  <td>
                    <strong>{o.number}</strong>
                  </td>
                  <td>
                    {formatDate(o.createdAt)}, {formatTime(o.createdAt)}
                  </td>
                  <td>{customer?.name}</td>
                  <td>{formatPrice(orderTotal(o))}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td>
                    {canReassign ? (
                      <form
                        action={managerAssignCourier}
                        className="row"
                        style={{ flexWrap: "nowrap", gap: 6 }}
                      >
                        <input type="hidden" name="id" value={o.id} />
                        <select
                          className="select"
                          name="courierId"
                          defaultValue={o.courierId ?? ""}
                          aria-label="Курьер"
                        >
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
      </ListFilters>
    </>
  );
}
