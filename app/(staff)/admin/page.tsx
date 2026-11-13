import AccessDenied from "@/components/AccessDenied";
import { categories, orderTotal, products, promos, users } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatPrice } from "@/lib/labels";
import { getOrders } from "@/lib/orders";
import { canAccess, roleLabels, routeRoles } from "@/lib/permissions";
import { Star } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";

// Макет админ-панели: статистика, меню, сотрудники и промокоды.
export default async function AdminPage() {
  const { role } = await getSession();

  if (!canAccess(role, "/admin")) {
    return <AccessDenied allowed={routeRoles["/admin"]} />;
  }

  const orders = getOrders();
  const paid = orders.filter((o) => o.status !== "CANCELLED");
  const revenue = paid.reduce((sum, o) => sum + orderTotal(o), 0);
  const avgCheck = paid.length ? Math.round(revenue / paid.length) : 0;
  const staff = users.filter((u) => u.role !== "customer");
  const maxSales = Math.max(...promos.stats.salesByDay.map((d) => d.amount));

  return (
    <>
      <div className="page-head">
        <h1>Админ-панель</h1>
        <p className="muted">Показатели работы пиццерии (демо-данные).</p>
      </div>

      <div className="stats">
        <div className="card stat">
          <div className="muted small">Заказов</div>
          <div className="value">{orders.length}</div>
        </div>
        <div className="card stat">
          <div className="muted small">Выручка</div>
          <div className="value">{formatPrice(revenue)}</div>
        </div>
        <div className="card stat">
          <div className="muted small">Средний чек</div>
          <div className="value">{formatPrice(avgCheck)}</div>
        </div>
        <div className="card stat">
          <div className="muted small">Рейтинг</div>
          <div className="value icon-row">
          <Star size={26} fill="currentColor" style={{ color: "var(--accent)" }} />
          {promos.stats.rating}
          </div>
          <div className="muted small">{promos.stats.reviews} отзывов</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Продажи за неделю</h2>
        <div className="bars">
          {promos.stats.salesByDay.map((d) => (
            <div key={d.day} className="bar">
              <span className="muted">{Math.round(d.amount / 1000)}к</span>
              <div className="bar-fill" style={{ height: `${(d.amount / maxSales) * 100}%` }} />
              <span>{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-head">
        <h2>Меню</h2>
        <button type="button" className="btn btn-primary btn-sm">
          + Добавить товар
        </button>
      </div>
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        <table>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Доступность</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
          <td>
         <span className="icon-row">
          <CategoryIcon name={categories.find((c) => c.id === p.categoryId)?.name ?? ""} />
          <strong>{p.name}</strong>
            </span>
              </td>
                <td>{categories.find((c) => c.id === p.categoryId)?.name}</td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  <span className={`badge ${p.isAvailable ? "badge-green" : "badge-gray"}`}>
                    {p.isAvailable ? "Доступен" : "Скрыт"}
                  </span>
                </td>
                <td className="right">
                  <button type="button" className="btn btn-ghost btn-sm">
                    Изменить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2">
        <div>
          <div className="section-head">
            <h2>Сотрудники</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Роль</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>
                      <span className="badge badge-blue">{roleLabels[u.role]}</span>
                    </td>
                    <td className="small muted">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="section-head">
            <h2>Промокоды</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Условие</th>
                  <th>Использован</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {promos.codes.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <strong>{c.code}</strong>
                    </td>
                    <td className="small">{c.description}</td>
                    <td className="small">{c.usage}</td>
                    <td>
                      <span className={`badge ${c.isActive ? "badge-green" : "badge-gray"}`}>
                        {c.isActive ? "Активен" : "Завершён"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
