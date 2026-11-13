import AccessDenied from "@/components/AccessDenied";
import AutoRefresh from "@/components/AutoRefresh";
import StatusBadge from "@/components/StatusBadge";
import { getUser, orderTotal, users } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { managerAssignCourier, managerCancel } from "@/lib/order-actions";
import { getOrders, isFinal } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";

// Все заказы: можно сменить курьера до выезда и отменить заказ.
export default async function ManagerPage() {
  const { role } = await getSession();

  if (!canAccess(role, "/manager")) {
    return <AccessDenied allowed={routeRoles["/manager"]} />;
  }

  const couriers = users.filter((u) => u.role === "courier");
  const orders = getOrders();
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
                <tr key={o.id}>
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
                    {!isFinal(o.status) && (
                      <form action={managerCancel}>
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="btn btn-ghost btn-sm">
                          Отменить
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
