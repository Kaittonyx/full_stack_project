import AccessDenied from "@/components/AccessDenied";
import StatusBadge from "@/components/StatusBadge";
import { getUser, orders } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { canAccess, routeRoles } from "@/lib/permissions";
import { orderTotal } from "@/lib/data";
import { MessageSquare } from "lucide-react";

// Макет панели курьера. Курьер видит только свои заказы и минимум данных клиента.
export default async function CourierPage() {
  const { role, user } = await getSession();

  if (!canAccess(role, "/courier")) {
    return <AccessDenied allowed={routeRoles["/courier"]} />;
  }

  const isCourier = role === "courier";
  const scope = isCourier ? orders.filter((o) => o.courierId === user?.id) : orders.filter((o) => o.courierId);
  const active = scope.filter((o) => ["ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY"].includes(o.status));
  const history = scope.filter((o) => o.status === "DELIVERED");
  const waiting = orders.filter((o) => o.status === "READY");

  return (
    <>
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
          return (
            <article key={o.id} className="card stack">
              <div className="row-between">
                <h3>{o.number}</h3>
                <StatusBadge status={o.status} />
              </div>
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
                    {formatPrice(orderTotal(o))} · {o.paymentMethod}
                  </div>
                </div>
              </div>
              {o.comment && (
  <div className="ticket note icon-row">
    <MessageSquare size={18} />
    {o.comment}
  </div>
)}
              <div className="row">
                {o.status === "ASSIGNED_TO_COURIER" ? (
                  <button type="button" className="btn btn-primary btn-sm">
                    Забрал, выехал
                  </button>
                ) : (
                  <button type="button" className="btn btn-green btn-sm">
                    Доставлен
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {waiting.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="section-head">
            <h2>Готовы к выдаче</h2>
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
                      <button type="button" className="btn btn-ghost btn-sm">
                        Взять заказ
                      </button>
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
