import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bike,
  ChevronDown,
  ClipboardList,
  EyeOff,
  Flame,
  Star,
  Tag,
  TicketPercent,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import AccessDenied from "@/components/AccessDenied";
import CategoryIcon from "@/components/CategoryIcon";
import ListFilters from "@/components/ListFilters";
import PromoManager from "@/components/PromoManager";
import SalesDetailsModal from "@/components/SalesDetailsModal";
import { addDays, buildSalesReport, dayKeyOf, lastDays, toFlat, todayKey } from "@/lib/analytics";
import { getUser, orderTotal, users } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatPrice } from "@/lib/labels";
import { plural } from "@/lib/plural";
import { getOrders } from "@/lib/orders";
import { canAccess, roleLabels, routeRoles } from "@/lib/permissions";
import { getProducts } from "@/lib/products-db";
import { getPromos, promoStatus } from "@/lib/promos";
import { buildRatingsReport } from "@/lib/reviews";

function greeting() {
  const hour = new Date(Date.now() + 5 * 60 * 60 * 1000).getUTCHours();
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export const metadata = { title: "Админ-панель" };

export default async function AdminPage() {
  const { role, user } = await getSession();

  if (!canAccess(role, "/admin")) {
    return <AccessDenied allowed={routeRoles["/admin"]} />;
  }

  const [products, promoList] = await Promise.all([getProducts(), getPromos()]);
  const orders = getOrders();
  const flat = toFlat(orders);
  const today = todayKey();
  const todayReport = buildSalesReport(flat, today, today);
  const yesterdayReport = buildSalesReport(flat, addDays(today, -1), addDays(today, -1));
  const weekRange = lastDays(7);
  const week = buildSalesReport(flat, weekRange.from, weekRange.to);
  const weekMax = Math.max(1, ...week.series.map((day) => day.revenue));
  const ratings = buildRatingsReport((id) => getUser(id)?.name ?? "Курьер");
  const delta =
    yesterdayReport.revenue > 0
      ? Math.round(((todayReport.revenue - yesterdayReport.revenue) / yesterdayReport.revenue) * 100)
      : null;

  const paidOrders = orders.filter((order) => order.status !== "CANCELLED");
  const revenue = paidOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const avgCheck = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;
  const inProgress = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length;
  const newOrders = orders.filter((order) => order.status === "CONFIRMED").length;
  const noCourier = orders.filter((order) => order.status === "READY" && !order.courierId).length;
  const hidden = products.filter((product) => !product.isAvailable).length;
  const staff = users.filter((employee) => employee.role !== "customer");
  const expiring = promoList.filter(
    (promo) => promoStatus(promo).active && promo.expiresAt && promo.expiresAt <= addDays(today, 3),
  ).length;

  const todayOrders = orders.filter((order) => dayKeyOf(order.createdAt) === today);
  const soldByName = new Map<string, number>();
  for (const order of paidOrders) {
    for (const item of order.items) {
      soldByName.set(item.name, (soldByName.get(item.name) ?? 0) + item.quantity);
    }
  }
  const top = [...soldByName.entries()].sort((left, right) => right[1] - left[1])[0];

  const attention = [
    {
      count: newOrders,
      text: plural(newOrders, "новый заказ ждёт кухню", "новых заказа ждут кухню", "новых заказов ждут кухню"),
      href: "/kitchen",
      icon: Flame,
    },
    {
      count: noCourier,
      text: plural(noCourier, "готовый заказ без курьера", "готовых заказа без курьера", "готовых заказов без курьера"),
      href: "/manager?view=active",
      icon: Bike,
    },
    {
      count: hidden,
      text: plural(hidden, "блюдо скрыто из меню", "блюда скрыты из меню", "блюд скрыто из меню"),
      href: "/manager/menu",
      icon: EyeOff,
    },
    {
      count: expiring,
      text: plural(expiring, "промокод истекает в ближайшие 3 дня", "промокода истекают в ближайшие 3 дня", "промокодов истекают в ближайшие 3 дня"),
      href: "/admin/promos",
      icon: TicketPercent,
    },
  ].filter((item) => item.count > 0);

  return (
    <>
      <div className="dash-hero">
        <div>
          <h1>
            {greeting()}
            {user ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="muted">Сводка за сегодня, {today.split("-").reverse().join(".")}</p>
        </div>
      </div>

      <div className="kpi-grid">
        <Link href="/admin/analytics" className="card kpi kpi-link">
          <ArrowRight size={16} className="kpi-go" />
          <span className="kpi-icon"><Wallet size={20} /></span>
          <span className="muted small">Выручка сегодня</span>
          <strong className="kpi-value">{formatPrice(todayReport.revenue)}</strong>
          {delta !== null ? (
            <span className={`trend ${delta >= 0 ? "up" : "down"}`}>
              {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {delta >= 0 ? "+" : ""}
              {delta}% ко вчера
            </span>
          ) : (
            <span className="muted small">Вчера продаж не было</span>
          )}
        </Link>

        <Link href="/manager?view=today" className="card kpi kpi-link">
          <ArrowRight size={16} className="kpi-go" />
          <span className="kpi-icon"><ClipboardList size={20} /></span>
          <span className="muted small">Заказов сегодня</span>
          <strong className="kpi-value">{todayReport.orders}</strong>
          <span className="muted small">Средний чек {formatPrice(todayReport.avgCheck)}</span>
        </Link>

        <Link href="/manager?view=active" className="card kpi kpi-link">
          <ArrowRight size={16} className="kpi-go" />
          <span className="kpi-icon"><Flame size={20} /></span>
          <span className="muted small">В работе сейчас</span>
          <strong className="kpi-value">{inProgress}</strong>
          <span className="muted small">Готовятся и в пути</span>
        </Link>

        <Link href="/admin/analytics?tab=ratings" className="card kpi kpi-link">
          <ArrowRight size={16} className="kpi-go" />
          <span className="kpi-icon"><Star size={20} /></span>
          <span className="muted small">Рейтинг блюд</span>
          <strong className="kpi-value">{ratings.dishCount ? ratings.dishAvg.toFixed(1) : "—"}</strong>
          <span className="muted small">
            {ratings.dishCount ? `Оценок: ${ratings.dishCount}` : "Пока нет оценок"}
          </span>
        </Link>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div>
              <h3>Продажи за 7 дней</h3>
              <span className="muted small">
                {week.orders} {plural(week.orders, "заказ", "заказа", "заказов")} · {formatPrice(week.revenue)}
              </span>
            </div>
            <Link href="/admin/analytics" className="btn btn-ghost btn-sm">
              Подробнее <ArrowRight size={14} />
            </Link>
          </div>
          {week.orders === 0 ? (
            <div className="chart-empty muted">За последние 7 дней заказов не было</div>
          ) : (
            <div className="bars">
              {week.series.map((day) => (
                <div key={day.key} className="bar">
                  <span className="muted">{day.revenue ? `${Math.round(day.revenue / 100) / 10}к` : "0"}</span>
                  <div className="bar-fill" style={{ height: `${(day.revenue / weekMax) * 100}%`, minHeight: 4 }} />
                  <span>{day.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Требует внимания</h3>
          {attention.length === 0 ? (
            <p className="muted">Всё спокойно, срочных дел нет.</p>
          ) : (
            <ul className="attention">
              {attention.map((item) => (
                <li key={item.href + item.text}>
                  <Link href={item.href} className="attention-item">
                    <item.icon size={18} />
                    <span><strong>{item.count}</strong> {item.text}</span>
                    <ArrowRight size={16} className="attention-arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="page-head admin-legacy-head">
        <h2>Разделы админ-панели</h2>
        <p className="muted">Подробные показатели, меню, сотрудники и промокоды.</p>
      </div>
      <div className="admin-sections">
        <details className="card admin-disclosure" name="admin-section">
          <summary>
            <BarChart3 size={22} aria-hidden="true" />
            <span>
              <strong>Статистика</strong>
              <span className="muted small">Сводные показатели и продажи</span>
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <div className="admin-disclosure-content">
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
                <div className="muted small">В работе сейчас</div>
                <div className="value">{inProgress}</div>
                <div className="muted small">Заказов сегодня: {todayOrders.length}</div>
              </div>
              <div className="card stat">
                <div className="muted small">Хит продаж</div>
                <div className="value">{top ? top[0] : "—"}</div>
                <div className="muted small">{top ? `${top[1]} шт.` : "Пока нет заказов"}</div>
              </div>
              <div className="card stat">
                <div className="muted small">Рейтинг блюд</div>
                <div className="value icon-row">
                  <Star size={24} fill="currentColor" style={{ color: "var(--accent)" }} />
                  {ratings.dishCount ? ratings.dishAvg.toFixed(1) : "—"}
                </div>
                <div className="muted small">
                  {ratings.dishCount
                    ? `Доставка: ${ratings.deliveryCount ? ratings.deliveryAvg.toFixed(1) : "—"} · оценок: ${ratings.dishCount}`
                    : "Пока нет оценок"}
                </div>
              </div>
            </div>
            <div className="card admin-sales">
              <div className="row-between" style={{ marginBottom: 16 }}>
                <div>
                  <h3>Продажи за 7 дней</h3>
                  <span className="muted small">
                    {week.orders} заказов · {formatPrice(week.revenue)}
                  </span>
                </div>
                <SalesDetailsModal orders={flat} ratings={ratings} />
              </div>
              <div className="bars">
                {week.series.map((day) => (
                  <div key={day.key} className="bar">
                    <span className="muted">{day.revenue ? `${Math.round(day.revenue / 100) / 10}к` : "0"}</span>
                    <div className="bar-fill" style={{ height: `${(day.revenue / weekMax) * 100}%`, minHeight: 4 }} />
                    <span>{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/admin/analytics" className="btn btn-ghost btn-sm">
              Открыть полную аналитику <ArrowRight size={14} />
            </Link>
          </div>
        </details>

        <details className="card admin-disclosure" name="admin-section">
          <summary>
            <CategoryIcon name="Пиццы" />
            <span>
              <strong>Меню</strong>
              <span className="muted small">{products.length} позиций</span>
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <div className="admin-disclosure-content">
            <div className="stats">
              <div className="card stat">
                <div className="muted small">Всего позиций</div>
                <div className="value">{products.length}</div>
              </div>
              <div className="card stat">
                <div className="muted small">В наличии</div>
                <div className="value">{products.length - hidden}</div>
              </div>
              <div className="card stat">
                <div className="muted small">Скрыто</div>
                <div className="value">{hidden}</div>
              </div>
            </div>
            <Link href="/manager/menu" className="btn btn-primary">Управлять меню</Link>
          </div>
        </details>

        <details className="card admin-disclosure" name="admin-section">
          <summary>
            <Users size={22} aria-hidden="true" />
            <span>
              <strong>Сотрудники</strong>
              <span className="muted small">{staff.length} сотрудников</span>
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <div className="admin-disclosure-content">
            <ListFilters
              options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))}
              searchPlaceholder="Поиск сотрудников"
            >
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Имя</th><th>Роль</th><th>Email</th></tr>
                  </thead>
                  <tbody>
                    {staff.map((employee) => (
                      <tr
                        key={employee.id}
                        data-filter-item
                        data-filter={employee.role}
                        data-search={`${employee.name} ${employee.email} ${roleLabels[employee.role]}`}
                      >
                        <td>{employee.name}</td>
                        <td><span className="badge badge-blue">{roleLabels[employee.role]}</span></td>
                        <td className="small muted">{employee.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ListFilters>
            <Link href="/admin/staff" className="btn btn-ghost btn-sm">Открыть список сотрудников</Link>
          </div>
        </details>

        <details className="card admin-disclosure" name="admin-section">
          <summary>
            <Tag size={22} aria-hidden="true" />
            <span>
              <strong>Промокоды</strong>
              <span className="muted small">
                {promoList.filter((promo) => promoStatus(promo).active).length} активных из {promoList.length}
              </span>
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <div className="admin-disclosure-content">
            <PromoManager promos={promoList} />
            <Link href="/admin/promos" className="btn btn-ghost btn-sm">Открыть управление промокодами</Link>
          </div>
        </details>
      </div>
    </>
  );
}
