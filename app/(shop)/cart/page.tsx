import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import PromoForm from "@/components/PromoForm";
import { getStoredCart, summarize } from "@/lib/cart";
import { changeQuantity, removeFromCart } from "@/lib/cart-actions";
import { getSession } from "@/lib/demo-session";
import { formatPrice } from "@/lib/labels";
import { FREE_DELIVERY_FROM } from "@/lib/menu";
import { hasPreviousOrders } from "@/lib/orders";
import { Minus, Plus, X } from "lucide-react";



export default async function CartPage() {
  const { role, user } = await getSession();
  const cart = await getStoredCart();
  const s = summarize(cart, user ? hasPreviousOrders(user.id) : false);
  const canOrder = role === "customer" && s.lines.length > 0 && !s.promoError;

  return (
    <div className="container section">
      <div className="page-head">
        <h1>Корзина</h1>
      </div>

      {s.lines.length === 0 ? (
        <div className="card stack" style={{ alignItems: "flex-start" }}>
          <p className="muted">В корзине пока пусто.</p>
          <Link href="/catalog" className="btn btn-primary">
            Выбрать в меню
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="card">
            {s.lines.map(({ item, name, size, details, unitPrice, image, emoji }) => (
              <div key={item.key} className="cart-item">
                <div className="pic">
                  <ProductImage src={image} emoji={emoji} alt={name} />
                </div>
                <div className="info">
                  <h3>{name}</h3>
                  <p className="muted small">{[size, details].filter(Boolean).join(" · ") || "Стандартная порция"}</p>
                </div>
                <form action={changeQuantity} className="qty">
                  <input type="hidden" name="key" value={item.key} />
                  <button type="submit" name="delta" value="-1" aria-label="Уменьшить">
  <Minus size={16} />
</button>
<span>{item.quantity}</span>
<button type="submit" name="delta" value="1" aria-label="Увеличить">
  <Plus size={16} />
</button>
<button type="submit" className="btn btn-ghost btn-sm" aria-label="Удалить">
  <X size={16} />
</button>
                </form>
              </div>
            ))}
          </div>

          <aside className="card stack">
            <h3>Ваш заказ</h3>
            <PromoForm current={s.promo} />
            {s.promoError && (
              <p className="small" style={{ color: "var(--red, #d23a22)" }}>
                {s.promoError}. Уберите промокод, чтобы оформить заказ.
              </p>
            )}
            <div>
              <div className="sum-row">
                <span className="muted">Товары</span>
                <span>{formatPrice(s.subtotal)}</span>
              </div>
              {s.discount > 0 && (
                <div className="sum-row">
                  <span className="muted">Скидка ({s.promo})</span>
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
            {s.deliveryFee > 0 && (
              <p className="small muted">
                Бесплатная доставка от {formatPrice(FREE_DELIVERY_FROM)}, не хватает{" "}
                {formatPrice(FREE_DELIVERY_FROM - (s.subtotal - s.discount))}.
              </p>
            )}
            {role === "guest" ? (
              <>
                <p className="small muted">Чтобы оформить заказ, войдите или зарегистрируйтесь.</p>
                <Link href="/login" className="btn btn-primary btn-block">
                  Войти и оформить
                </Link>
              </>
            ) : role === "customer" ? (
              canOrder && (
                <Link href="/checkout" className="btn btn-primary btn-block">
                  Оформить заказ
                </Link>
              )
            ) : (
              <p className="small muted">Оформление заказов доступно клиентам.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
