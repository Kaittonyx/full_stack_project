import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";
import StatusBadge from "@/components/StatusBadge";
import { orderTotal } from "@/lib/data";
import { getOrdersByCustomer } from "@/lib/orders";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { canAccess, roleHome, roleLabels, routeRoles } from "@/lib/permissions";

export default async function ProfilePage() {
  const { role, user } = await getSession();

  if (!user || !canAccess(role, "/profile")) {
    return <AccessDenied allowed={routeRoles["/profile"]} />;
  }

  const myOrders = getOrdersByCustomer(user.id);

  return (
    <div className="container section">
      <div className="page-head">
        <h1>Личный кабинет</h1>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="row" style={{ marginBottom: 16 }}>
            <span className="avatar avatar-lg">{user.name[0]}</span>
            <div>
              <h2>{user.name}</h2>
              <span className="badge badge-gray">{roleLabels[role]}</span>
            </div>
          </div>
          <div className="stack">
            <div className="field">
              <label htmlFor="p-email">Email</label>
              <input id="p-email" className="input" defaultValue={user.email} />
            </div>
            <div className="field">
              <label htmlFor="p-phone">Телефон</label>
              <input id="p-phone" className="input" defaultValue={user.phone} />
            </div>
            <div className="row">
              <button type="button" className="btn btn-primary">
                Сохранить
              </button>
              {role !== "customer" && (
                <Link href={roleHome[role]} className="btn btn-ghost">
                  Рабочий кабинет
                </Link>
              )}
            </div>
          </div>
        </div>

        {role === "customer" && (
          <div className="card stack">
            <div className="row-between">
              <h2>Адреса доставки</h2>
              <button type="button" className="btn btn-ghost btn-sm">
                + Добавить
              </button>
            </div>
            {user.addresses?.map((a) => (
              <div key={a.id} className="card" style={{ boxShadow: "none" }}>
                <div className="row-between">
                  <strong>{a.label}</strong>
                  <button type="button" className="btn btn-ghost btn-sm">
                    Изменить
                  </button>
                </div>
                <p className="small">{a.line}</p>
                {a.comment && <p className="small muted">{a.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {role === "customer" && (
        <>
          <div className="section-head">
            <h2>Мои заказы</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Дата</th>
                  <th>Состав</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {myOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.number}</strong>
                    </td>
                    <td>
                      {formatDate(o.createdAt)}, {formatTime(o.createdAt)}
                    </td>
                    <td>{o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</td>
                    <td>{formatPrice(orderTotal(o))}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="right">
                      {o.status === "DELIVERED" ? (
                        <div className="row" style={{ justifyContent: "flex-end" }}>
                          <button type="button" className="btn btn-ghost btn-sm">
                            Повторить
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm">
                            ⭐ Оценить
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
