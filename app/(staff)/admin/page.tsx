import Link from "next/link";
import {
  ArrowRight,
  Bike,
  ClipboardList,
  EyeOff,
  Flame,
  Star,
  TicketPercent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import AccessDenied from "@/components/AccessDenied";
import { addDays, buildSalesReport, lastDays, toFlat, todayKey } from "@/lib/analytics";
import { getUser } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatPrice } from "@/lib/labels";
import { plural } from "@/lib/plural";
import { getOrders } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";
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

export const metadata = { title: "Сводка" };

export default async function AdminPage() {
  const { role, user } = await getSession();

  if (!canAccess(role, "/admin")) {
    return <AccessDenied allowed={routeRoles["/admin"]} />;
  }

  const orders = getOrders();
  const flat = toFlat(orders);
  const today = todayKey();

  const todayR = buildSalesReport(flat, today, today);
  const yestR = buildSalesReport(flat, addDays(today, -1), addDays(today, -1));
  const weekRange = lastDays(7);
  const week = buildSalesReport(flat, weekRange.from, weekRange.to);
  const weekMax = Math.max(1, ...week.series.map((d) => d.revenue));
  const ratings = buildRatingsReport((id) => getUser(id)?.name ?? "Курьер");

  const delta = yestR.revenue > 0 ? Math.round(((todayR.revenue - yestR.revenue) / yestR.revenue) * 100) : null;

  const inProgress = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length;
  const newOrders = orders.filter((o) => o.status === "CONFIRMED").length;
  const noCourier = orders.filter((o) => o.status === "READY" && !o.courierId).length;
  const hidden = (await getProducts()).filter((p) => !p.isAvailable).length;
  const soon = addDays(today, 3);
  const expiring = getPromos().filter((p) => promoStatus(p).active && p.expiresAt && p.expiresAt <= soon).length;

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
].filter((a) => a.count > 0);

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
          <span className="kpi-icon">
            <Wallet size={20} />
          </span>
          <span className="muted small">Выручка сегодня</span>
          <strong className="kpi-value">{formatPrice(todayR.revenue)}</strong>
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
          <span className="kpi-icon">
            <ClipboardList size={20} />
          </span>
          <span className="muted small">Заказов сегодня</span>
          <strong className="kpi-value">{todayR.orders}</strong>
          <span className="muted small">Средний чек {formatPrice(todayR.avgCheck)}</span>
        </Link>

        <Link href="/manager?view=active" className="card kpi kpi-link">
          <ArrowRight size={16} className="kpi-go" />
          <span className="kpi-icon">
            <Flame size={20} />
          </span>
          <span className="muted small">В работе сейчас</span>
          <strong className="kpi-value">{inProgress}</strong>
          <span className="muted small">Готовятся и в пути</span>
        </Link>

        <Link href="/admin/analytics?tab=ratings" className="card kpi kpi-link">
          <ArrowRight size={16} className="kpi-go" />
          <span className="kpi-icon">
            <Star size={20} />
          </span>
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
              Подробнее
              <ArrowRight size={14} />
            </Link>
          </div>
          {week.orders === 0 ? (
            <div className="chart-empty muted">За последние 7 дней заказов не было</div>
          ) : (
            <div className="bars">
              {week.series.map((d) => (
                <div key={d.key} className="bar">
                  <span className="muted">{d.revenue ? `${Math.round(d.revenue / 100) / 10}к` : "0"}</span>
                  <div className="bar-fill" style={{ height: `${(d.revenue / weekMax) * 100}%`, minHeight: 4 }} />
                  <span>{d.label}</span>
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
              {attention.map((a) => (
                <li key={a.href + a.text}>
                  <Link href={a.href} className="attention-item">
                    <a.icon size={18} />
                    <span>
                      <strong>{a.count}</strong> {a.text}
                    </span>
                    <ArrowRight size={16} className="attention-arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}