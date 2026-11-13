import { redirect } from "next/navigation";
import AccessDenied from "@/components/AccessDenied";
import CheckoutForm from "@/components/CheckoutForm";
import { getStoredCart, summarize } from "@/lib/cart";
import { getSession } from "@/lib/demo-session";
import { formatPrice } from "@/lib/labels";
import { hasPreviousOrders } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";

export default async function CheckoutPage() {
  const { role, user } = await getSession();
  if (!user || !canAccess(role, "/checkout")) {
    return <AccessDenied allowed={routeRoles["/checkout"]} />;
  }

  const s = summarize(await getStoredCart(), hasPreviousOrders(user.id));
  if (s.lines.length === 0 || s.promoError) redirect("/cart");

  return (
    <div className="container section">
      <div className="page-head">
        <h1>Оформление заказа</h1>
      </div>
      <div className="cart-layout">
        <CheckoutForm addresses={user.addresses ?? []} />
        <aside className="card stack">
          <h3>Состав заказа</h3>
          <div className="stack" style={{ gap: 8 }}>
            {s.lines.map((l) => (
              <div key={l.item.key} className="row-between small">
                <span>
                  {l.name}
                  {l.size ? `, ${l.size}` : ""} ×{l.item.quantity}
                </span>
                <span>{formatPrice(l.unitPrice * l.item.quantity)}</span>
              </div>
            ))}
          </div>
          <div>
            {s.discount > 0 && (
              <div className="sum-row">
                <span className="muted">Скидка</span>
                <span>−{formatPrice(s.discount)}</span>
              </div>
            )}
            <div className="sum-row">
              <span className="muted">Доставка</span>
              <span>{s.deliveryFee === 0 ? "бесплатно" : formatPrice(s.deliveryFee)}</span>
            </div>
            <div className="sum-row sum-total">
              <span>Итого</span>
              <span>{formatPrice(s.total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
