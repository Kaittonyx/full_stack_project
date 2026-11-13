import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";
import AutoRefresh from "@/components/AutoRefresh";
import OrderProgress from "@/components/OrderProgress";
import StatusBadge from "@/components/StatusBadge";
import { getUser, orderTotal } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { cancelMyOrder } from "@/lib/order-actions";
import { getOrdersByCustomer } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";

type SearchParams = Promise<{ placed?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { role, user } = await getSession();
  if (!user || !canAccess(role, "/orders")) {
    return <AccessDenied allowed={routeRoles["/orders"]} />;
  }
  const { placed } = await searchParams;
  const orders = getOrdersByCustomer(user.id);

  return (
    <div className="container section">
      <AutoRefresh seconds={5} />
      <div className="page-head">
        <h1>Мои заказы</h1>
      </div>

      {placed && (
        <p className="notice" style={{ marginBottom: 16 }}>
          Заказ принят и передан на кухню. Статус обновляется автоматически.
        </p>
      )}

      {orders.length === 0 ? (
        <div className="card stack" style={{ alignItems: "flex-start" }}>
          <p className="muted">Заказов пока нет.</p>
          <Link href="/catalog" className="btn btn-primary">
            Выбрать в меню
          </Link>
        </div>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {orders.map((o) => {
            const courier = getUser(o.courierId);
            return (
              <article key={o.id} className="card stack">
                <div className="row-between">
                  <h3>
                    {o.number}{" "}
                    <span className="muted small">
                      {formatDate(o.createdAt)}, {formatTime(o.createdAt)}
                    </span>
                  </h3>
                  <StatusBadge status={o.status} />
                </div>

                <OrderProgress order={o} />

                <ul className="small" style={{ paddingLeft: 18 }}>
                  {o.items.map((i, idx) => (
                    <li key={idx}>
                      {i.name}
                      {i.size ? `, ${i.size}` : ""} ×{i.quantity} — {formatPrice(i.unitPrice * i.quantity)}
                    </li>
                  ))}
                </ul>

                <div className="row-between small">
                  <span className="muted">{o.address}</span>
                  <strong>{formatPrice(orderTotal(o))}</strong>
                </div>

                {courier && ["ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY"].includes(o.status) && (
                  <p className="small">
                    Курьер: <strong>{courier.name.split(" ")[0]}</strong>, {courier.phone}
                  </p>
                )}

                {(o.status === "CONFIRMED" || o.status === "PENDING") && (
                  <form action={cancelMyOrder}>
                    <input type="hidden" name="id" value={o.id} />
                    <button type="submit" className="btn btn-ghost btn-sm">
                      Отменить заказ
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
