import Link from "next/link";
import { RotateCcw, Utensils } from "lucide-react";
import AccessDenied from "@/components/AccessDenied";
import AutoRefresh from "@/components/AutoRefresh";
import ListFilters from "@/components/ListFilters";
import OrderProgress from "@/components/OrderProgress";
import ReviewOrderModal from "@/components/ReviewOrderModal";
import StarRating from "@/components/StarRating";
import StatusBadge from "@/components/StatusBadge";
import { getUser, orderTotal, products as menuProducts } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { cancelMyOrder } from "@/lib/order-actions";
import { getOrdersByCustomer } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";
import { getProducts } from "@/lib/products-db";
import { repeatItem, repeatOrder } from "@/lib/repeat-actions";
import { getReviewsByOrder } from "@/lib/reviews";

type SearchParams = Promise<{ placed?: string; added?: string; skipped?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
    const { role, user } = await getSession();
    if (!user || !canAccess(role, "/orders")) {
        return <AccessDenied allowed={routeRoles["/orders"]} />;
    }

    const { placed, added, skipped } = await searchParams;
    const orders = getOrdersByCustomer(user.id);

    const imageByName = new Map((await getProducts()).map((p) => [p.name, p.image]));
    const repeatable = new Set(menuProducts.filter((p) => p.isAvailable).map((p) => p.name));

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

            {added !== undefined && (
                <div className="notice" style={{ marginBottom: 16 }}>
          <span>
            {Number(added) > 0 ? `Добавлено в корзину: ${added}.` : "Ничего не добавлено."}
              {Number(skipped) > 0 && ` Пропущено: ${skipped} (блюда нет в меню или это своя пицца).`}
          </span>
                    <Link href="/cart" className="btn btn-primary btn-sm">
                        Перейти в корзину
                    </Link>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="card stack" style={{ alignItems: "flex-start" }}>
                    <p className="muted">Заказов пока нет.</p>
                    <Link href="/catalog" className="btn btn-primary">
                        Выбрать в меню
                    </Link>
                </div>
            ) : (
                <ListFilters
                    options={[
                        { value: "PENDING", label: "Ожидает" },
                        { value: "CONFIRMED", label: "Подтверждён" },
                        { value: "PREPARING", label: "Готовится" },
                        { value: "READY", label: "Готов" },
                        { value: "OUT_FOR_DELIVERY", label: "В пути" },
                        { value: "DELIVERED", label: "Доставлен" },
                        { value: "CANCELLED", label: "Отменён" },
                    ]}
                    searchPlaceholder="Поиск по номеру или блюду"
                >
                    <div className="stack" style={{ gap: 16 }}>
                        {orders.map((o) => {
                            const courier = getUser(o.courierId);
                            const reviews = getReviewsByOrder(o.id);
                            const dishReviews = reviews.filter((r) => r.kind !== "delivery");
                            const deliveryReview = reviews.find((r) => r.kind === "delivery");
                            const ratingByDish = new Map(dishReviews.map((r) => [r.dish, r.rating]));
                            const canRepeatSome = o.items.some((i) => repeatable.has(i.name));

                            return (
                                <article key={o.id} className="card order-card" data-filter-item data-filter={o.status}>
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

                                    <ul className="order-lines">
                                        {o.items.map((i, idx) => {
                                            const image = imageByName.get(i.name);
                                            const rated = ratingByDish.get(i.name);
                                            return (
                                                <li key={idx} className="order-line">
                                                    <div className="order-thumb">
                                                        {image ? <img src={image} alt={i.name} /> : <Utensils size={22} />}
                                                    </div>
                                                    <div className="order-line-info">
                                                        <strong>{i.name}</strong>
                                                        <span className="small muted">
                              {[i.size, i.details].filter(Boolean).join(" · ") || "Стандартная порция"}
                            </span>
                                                        {rated ? <StarRating value={rated} size={13} /> : null}
                                                    </div>
                                                    <div className="order-line-sum">
                            <span className="small muted">
                              {i.quantity} × {formatPrice(i.unitPrice)}
                            </span>
                                                        <strong>{formatPrice(i.unitPrice * i.quantity)}</strong>
                                                    </div>
                                                    {repeatable.has(i.name) ? (
                                                        <form action={repeatItem}>
                                                            <input type="hidden" name="orderId" value={o.id} />
                                                            <input type="hidden" name="index" value={idx} />
                                                            <button
                                                                type="submit"
                                                                className="icon-btn"
                                                                title="Добавить это блюдо в корзину ещё раз"
                                                                aria-label={`Добавить ещё раз: ${i.name}`}
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                        </form>
                                                    ) : (
                                                        <span />
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <div className="row-between small">
                                        <span className="muted">{o.address}</span>
                                        <strong className="order-total">{formatPrice(orderTotal(o))}</strong>
                                    </div>

                                    {courier && ["ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY"].includes(o.status) && (
                                        <p className="small">
                                            Курьер: <strong>{courier.name.split(" ")[0]}</strong>, {courier.phone}
                                        </p>
                                    )}

                                    {o.status === "DELIVERED" && reviews.length > 0 && (
                                        <div className="order-rated small">
                                            <span className="muted">Вы оценили:</span>
                                            {dishReviews.length > 0 && (
                                                <span className="icon-row">
                          блюда
                          <StarRating
                              value={dishReviews.reduce((s, r) => s + r.rating, 0) / dishReviews.length}
                              size={14}
                          />
                        </span>
                                            )}
                                            {deliveryReview && (
                                                <span className="icon-row">
                          доставку
                          <StarRating value={deliveryReview.rating} size={14} />
                        </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="order-actions">
                                        {canRepeatSome && (
                                            <form action={repeatOrder}>
                                                <input type="hidden" name="orderId" value={o.id} />
                                                <button type="submit" className="btn btn-ghost btn-sm">
                                                    <RotateCcw size={16} />
                                                    Повторить заказ
                                                </button>
                                            </form>
                                        )}

                                        {o.status === "DELIVERED" && reviews.length === 0 && <ReviewOrderModal order={o} />}

                                        {(o.status === "CONFIRMED" || o.status === "PENDING") && (
                                            <form action={cancelMyOrder}>
                                                <input type="hidden" name="id" value={o.id} />
                                                <button type="submit" className="btn btn-ghost btn-sm">
                                                    Отменить заказ
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </ListFilters>
            )}
        </div>
    );
}