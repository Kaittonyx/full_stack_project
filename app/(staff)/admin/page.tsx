import AccessDenied from "@/components/AccessDenied";
import {orderTotal, promos, users} from "@/lib/data";
import {getProducts} from "@/lib/products-db";
import {getSession} from "@/lib/demo-session";
import Link from "next/link";
import {formatPrice} from "@/lib/labels";
import {getOrders} from "@/lib/orders";
import {canAccess, roleLabels, routeRoles} from "@/lib/permissions";
import {BarChart3, ChevronDown, Tag, Users} from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import ListFilters from "@/components/ListFilters";

// Макет админ-панели: статистика, меню, сотрудники и промокоды.
export default async function AdminPage() {
    const {role} = await getSession();

    if (!canAccess(role, "/admin")) {
        return <AccessDenied allowed={routeRoles["/admin"]}/>;
    }

    const products = await getProducts();
    const orders = getOrders();
    const paid = orders.filter((o) => o.status !== "CANCELLED");
    const revenue = paid.reduce((sum, o) => sum + orderTotal(o), 0);
    const avgCheck = paid.length ? Math.round(revenue / paid.length) : 0;
    const staff = users.filter((u) => u.role !== "customer");
    const maxSales = Math.max(...promos.stats.salesByDay.map((d) => d.amount));
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
    const inProgress = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length;

    const soldByName = new Map<string, number>();
    for (const o of paid) {
        for (const i of o.items) {
            soldByName.set(i.name, (soldByName.get(i.name) ?? 0) + i.quantity);
        }
    }
    const top = [...soldByName.entries()].sort((a, b) => b[1] - a[1])[0];

    return (
        <>
            <div className="page-head">
                <h1>Админ-панель</h1>
                <p className="muted">Показатели работы пиццерии (демо-данные).</p>
            </div>

            <p className="muted admin-sections-hint">Выберите раздел, чтобы открыть его содержимое.</p>

            <div className="admin-sections">
                <details className="card admin-disclosure" name="admin-section">

                    <summary>
                        <BarChart3 size={22} aria-hidden="true"/>
                        <span>
              <strong>Статистика</strong>
              <span className="muted small">Показатели и продажи за неделю</span>
            </span>
                        <ChevronDown size={18} aria-hidden="true"/>
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
                        </div>
                        <div className="card admin-sales">
                            <h2 style={{marginBottom: 16}}>Продажи за неделю</h2>
                            <div className="bars">
                                {promos.stats.salesByDay.map((d) => (
                                    <div key={d.day} className="bar">
                                        <span className="muted">{Math.round(d.amount / 1000)}к</span>
                                        <div className="bar-fill" style={{height: `${(d.amount / maxSales) * 100}%`}}/>
                                        <span>{d.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </details>

                <details className="card admin-disclosure" name="admin-section">
                    <summary>
                        <CategoryIcon name="Пиццы"/>
                        <span>
      <strong>Меню</strong>
      <span className="muted small">{products.length} позиций</span>
    </span>
                        <ChevronDown size={18} aria-hidden="true"/>
                    </summary>
                    <div className="admin-disclosure-content">
                        <div className="stats">
                            <div className="card stat">
                                <div className="muted small">Всего позиций</div>
                                <div className="value">{products.length}</div>
                            </div>
                            <div className="card stat">
                                <div className="muted small">В наличии</div>
                                <div className="value">{products.filter((p) => p.isAvailable).length}</div>
                            </div>
                            <div className="card stat">
                                <div className="muted small">Скрыто</div>
                                <div className="value">{products.filter((p) => !p.isAvailable).length}</div>
                            </div>
                        </div>
                        <Link href="/manager/menu" className="btn btn-primary">
                            Управлять меню
                        </Link>
                    </div>
                </details>

                <details className="card admin-disclosure" name="admin-section">
                    <summary>
                        <Users size={22} aria-hidden="true"/>
                        <span>
              <strong>Сотрудники</strong>
              <span className="muted small">{staff.length} сотрудников</span>
            </span>
                        <ChevronDown size={18} aria-hidden="true"/>
                    </summary>
                    <div className="admin-disclosure-content">
                        <ListFilters
                            options={Object.entries(roleLabels).map(([value, label]) => ({value, label}))}
                            searchPlaceholder="Поиск сотрудников"
                        >
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
                                        <tr
                                            key={u.id}
                                            data-filter-item
                                            data-filter={u.role}
                                            data-search={`${u.name} ${u.email} ${roleLabels[u.role]}`}
                                        >
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
                        </ListFilters>
                    </div>
                </details>

                <details className="card admin-disclosure" name="admin-section">
                    <summary>
                        <Tag size={22} aria-hidden="true"/>
                        <span>
              <strong>Промокоды</strong>
              <span className="muted small">{promos.codes.length} кодов</span>
            </span>
                        <ChevronDown size={18} aria-hidden="true"/>
                    </summary>
                    <div className="admin-disclosure-content">
                        <ListFilters
                            options={[
                                {value: "active", label: "Активные"},
                                {value: "inactive", label: "Завершённые"},
                            ]}
                            searchPlaceholder="Поиск промокодов"
                        >
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
                                        <tr
                                            key={c.code}
                                            data-filter-item
                                            data-filter={c.isActive ? "active" : "inactive"}
                                            data-search={`${c.code} ${c.description}`}
                                        >
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
                        </ListFilters>
                    </div>
                </details>
            </div>
        </>
    );
}
