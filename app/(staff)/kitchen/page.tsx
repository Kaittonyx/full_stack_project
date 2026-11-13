import AccessDenied from "@/components/AccessDenied";
import AutoRefresh from "@/components/AutoRefresh";
import { getUser } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatTime } from "@/lib/labels";
import { kitchenFinish, kitchenStart } from "@/lib/order-actions";
import { getOrdersByStatus } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";
import type { OrderStatus } from "@/lib/types";

const columns: {
  statuses: OrderStatus[];
  title: string;
  action: ((formData: FormData) => Promise<void>) | null;
  actionLabel: string;
}[] = [
  { statuses: ["CONFIRMED"], title: "Новые", action: kitchenStart, actionLabel: "Принять в работу" },
  { statuses: ["PREPARING"], title: "Готовятся", action: kitchenFinish, actionLabel: "Отметить готовым" },
  { statuses: ["READY", "ASSIGNED_TO_COURIER"], title: "Ждут курьера", action: null, actionLabel: "" },
];

export default async function KitchenPage() {
  const { role } = await getSession();

  if (!canAccess(role, "/kitchen")) {
    return <AccessDenied allowed={routeRoles["/kitchen"]} />;
  }

  return (
    <>
      <AutoRefresh seconds={4} />
      <div className="page-head">
        <h1>Кухня</h1>
        <p className="muted">
          Очередь заказов. Когда вы отметите заказ готовым, курьер назначится автоматически.
        </p>
      </div>

      <div className="kanban">
        {columns.map((col) => {
          const list = getOrdersByStatus(...col.statuses);
          return (
            <div key={col.title} className="column">
              <div className="column-title">
                <span>{col.title}</span>
                <span className="badge badge-gray">{list.length}</span>
              </div>

              {list.length === 0 && <p className="muted small">Пока пусто</p>}

              {list.map((o) => (
                <article key={o.id} className="ticket">
                  <div className="row-between">
                    <strong>{o.number}</strong>
                    <span className="muted small">с {formatTime(o.createdAt)}</span>
                  </div>
                  <ul>
                    {o.items.map((i, idx) => (
                      <li key={idx}>
                        {i.name}
                        {i.size ? `, ${i.size}` : ""} ×{i.quantity}
                        {i.details && <div className="detail">{i.details}</div>}
                      </li>
                    ))}
                  </ul>
                  {o.comment && <div className="note">💬 {o.comment}</div>}
                  {o.courierId && (
                    <div className="small muted">🛵 Курьер: {getUser(o.courierId)?.name}</div>
                  )}
                  {col.action && (
                    <form action={col.action}>
                      <input type="hidden" name="id" value={o.id} />
                      <button type="submit" className="btn btn-primary btn-sm">
                        {col.actionLabel}
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
