import AccessDenied from "@/components/AccessDenied";
import AutoRefresh from "@/components/AutoRefresh";
import StatusBadge from "@/components/StatusBadge";
import { getUser, orderTotal } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { courierDeliver, courierPickUp, courierTake } from "@/lib/order-actions";
import { getOrders, getOrdersByCourier, getOrdersByStatus } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";
<<<<<<< HEAD
=======
import { orderTotal } from "@/lib/data";
import { MessageSquare } from "lucide-react";
>>>>>>> origin/main

// Курьер видит только свои заказы и минимум данных клиента.
export default async function CourierPage() {
  const { role, user } = await getSession();

  if (!canAccess(role, "/courier")) {
    return <AccessDenied allowed={routeRoles["/courier"]} />;
  }

  const isCourier = role === "courier";
  const scope = isCourier ? getOrdersByCourier(user?.id ?? "") : getOrders().filter((o) => o.courierId);
  const active = scope.filter((o) => ["ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY"].includes(o.status));
  const history = scope.filter((o) => o.status === "DELIVERED");
  const waiting = getOrdersByStatus("READY").filter((o) => !o.courierId);

  return (
    <>
      <AutoRefresh seconds={5} />
      <div className="page-head">
        <h1>Доставки</h1>
        <p className="muted">
          {isCourier ? "Ваши назначенные заказы." : "Все доставки (просмотр для руководства)."}
        </p>
      </div>

      <div className="stack" style={{ gap: 16 }}>
        {active.length === 0 && (
          <div className="card muted">Активных доставок нет. Ожидайте назначения.</div>
        )}

        {active.map((o) => {
          const customer = getUser(o.customerId);
          const courier = getUser(o.courierId);
          return (
            <article key={o.id} className="card stack">
              <div className="row-between">
                <h3>{o.number}</h3>
                <StatusBadge status={o.status} />
              </div>
              {!isCourier && courier && <div className="small muted">Курьер: {courier.name}</div>}
              <div>
                <div className="small muted">Адрес</div>
                <div>{o.address}</div>
                {o.addressComment && <div className="small muted">{o.addressComment}</div>}
              </div>
              <div className="row" style={{ gap: 24 }}>
                <div>
                  <div className="small muted">Клиент</div>
                  <div>{customer?.name.split(" ")[0]}</div>
                </div>
                <div>
                  <div className="small muted">Телефон</div>
                  <div>{customer?.phone}</div>
                </div>
                <div>
                  <div className="small muted">К оплате</div>
                  <div>
                    {o.paymentMethod === "Картой онлайн" ? "оплачено" : formatPrice(orderTotal(o))} ·{" "}
                    {o.paymentMethod}
                  </div>
                </div>
              </div>
<<<<<<< HEAD
              {o.comment && <div className="ticket note">💬 {o.comment}</div>}
              <form className="row" action={o.status === "ASSIGNED_TO_COURIER" ? courierPickUp : courierDeliver}>
                <input type="hidden" name="id" value={o.id} />
=======
              {o.comment && (
  <div className="ticket note icon-row">
    <MessageSquare size={18} />
    {o.comment}
  </div>
)}
              <div className="row">
>>>>>>> origin/main
                {o.status === "ASSIGNED_TO_COURIER" ? (
                  <button type="submit" className="btn btn-primary btn-sm">
                    Забрал, выехал
                  </button>
                ) : (
                  <button type="submit" className="btn btn-green btn-sm">
                    Доставлен
                  </button>
                )}
              </form>
            </article>
          );
        })}
      </div>

      {waiting.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="section-head">
            <h2>Готовы к выдаче, без курьера</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Адрес</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {waiting.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.number}</strong>
                    </td>
                    <td>{o.address}</td>
                    <td className="right">
                      {isCourier && (
                        <form action={courierTake}>
                          <input type="hidden" name="id" value={o.id} />
                          <button type="submit" className="btn btn-ghost btn-sm">
                            Взять заказ
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <div className="section-head">
          <h2>История доставок</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Заказ</th>
                <th>Дата</th>
                <th>Адрес</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    Пока нет доставленных заказов
                  </td>
                </tr>
              )}
              {history.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.number}</strong>
                  </td>
                  <td>
                    {formatDate(o.createdAt)}, {formatTime(o.createdAt)}
                  </td>
                  <td>{o.address}</td>
                  <td>{formatPrice(orderTotal(o))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
