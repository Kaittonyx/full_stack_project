import AccessDenied from "@/components/AccessDenied";
import { orders } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatTime } from "@/lib/labels";
import { canAccess, routeRoles } from "@/lib/permissions";
import type { OrderStatus } from "@/lib/types";
import { MessageSquare } from "lucide-react";

const columns: { status: OrderStatus; title: string; action: string | null }[] = [
  { status: "CONFIRMED", title: "Новые", action: "Принять в работу" },
  { status: "PREPARING", title: "Готовятся", action: "Отметить готовым" },
  { status: "READY", title: "Готовы к выдаче", action: null },
];

// Макет панели повара. Смена статусов будет работать через API кухни (разработчик №4).
export default async function KitchenPage() {
  const { role } = await getSession();

  if (!canAccess(role, "/kitchen")) {
    return <AccessDenied allowed={routeRoles["/kitchen"]} />;
  }

  return (
    <>
      <div className="page-head">
        <h1>Кухня</h1>
        <p className="muted">Очередь заказов. Карточки обновляются каждые несколько секунд.</p>
      </div>

      <div className="kanban">
        {columns.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="column">
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
                      </li>
                    ))}
                  </ul>
                  {o.comment && (
  <div className="note icon-row">
    <MessageSquare size={18} />
    {o.comment}
  </div>
)}
                  {col.action && (
                    <button type="button" className="btn btn-primary btn-sm">
                      {col.action}
                    </button>
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
