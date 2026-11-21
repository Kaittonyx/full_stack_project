
import ModalButton from "@/components/ModalButton";
import StatusBadge from "@/components/StatusBadge";
import { getUser, itemsTotal } from "@/lib/data";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import type { Order } from "@/lib/types";

export default function OrderDetailsModal({ order }: { order: Order }) {
    const customer = getUser(order.customerId);
    const courier = getUser(order.courierId);
    const history = order.history ?? [];

    const who = (by?: string) => {
        if (!by) return "—";
        if (by === "system") return "Система";
        return getUser(by)?.name ?? by;
    };

    return (
        <ModalButton
            label="Состав"
            title={`Заказ ${order.number}`}
            resetKey={`${order.id}-${order.status}`}
        >
            <div className="order-details">
                <div className="row-between">
                    <StatusBadge status={order.status} />
                    <span className="muted small">
            {formatDate(order.createdAt)}, {formatTime(order.createdAt)}
          </span>
                </div>

                <section>
                    <h3>Что заказано</h3>
                    <ul className="order-items">
                        {order.items.map((i, idx) => (
                            <li key={idx}>
                                <div>
                                    <strong>{i.name}</strong>
                                    {i.size ? `, ${i.size}` : ""}
                                    {i.details && <div className="small muted">{i.details}</div>}
                                </div>
                                <div className="order-item-sum">
                                    {i.quantity} × {formatPrice(i.unitPrice)}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="sum-row">
                        <span className="muted">Товары</span>
                        <span>{formatPrice(itemsTotal(order.items))}</span>
                    </div>
                    <div className="sum-row">
                        <span className="muted">Доставка</span>
                        <span>{order.deliveryFee === 0 ? "бесплатно" : formatPrice(order.deliveryFee)}</span>
                    </div>
                    {order.discount > 0 && (
                        <div className="sum-row">
                            <span className="muted">Скидка</span>
                            <span>−{formatPrice(order.discount)}</span>
                        </div>
                    )}
                    <div className="sum-row sum-total">
                        <span>Итого</span>
                        <span>{formatPrice(itemsTotal(order.items) + order.deliveryFee - order.discount)}</span>
                    </div>
                </section>

                <section>
                    <h3>Клиент и доставка</h3>
                    <div className="small muted">Клиент</div>
                    <div>
                        {customer?.name} · {customer?.phone}
                    </div>
                    <div className="small muted" style={{ marginTop: 8 }}>
                        Адрес
                    </div>
                    <div>{order.address}</div>
                    {order.addressComment && <div className="small muted">{order.addressComment}</div>}
                    <div className="small muted" style={{ marginTop: 8 }}>
                        Оплата
                    </div>
                    <div>{order.paymentMethod}</div>
                    {order.comment && (
                        <>
                            <div className="small muted" style={{ marginTop: 8 }}>
                                Комментарий к заказу
                            </div>
                            <div>{order.comment}</div>
                        </>
                    )}
                    {courier && (
                        <>
                            <div className="small muted" style={{ marginTop: 8 }}>
                                Курьер
                            </div>
                            <div>{courier.name}</div>
                        </>
                    )}
                </section>

                {history.length > 0 && (
                    <section>
                        <h3>История статусов</h3>
                        <ul className="order-history">
                            {history.map((h, idx) => (
                                <li key={idx}>
                                    <StatusBadge status={h.status} />
                                    <span className="small muted">
                    {formatTime(h.at)} · {who(h.by)}
                  </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </ModalButton>
    );
}