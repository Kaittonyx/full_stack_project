import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { cart, getProduct } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatPrice } from "@/lib/labels";

const DELIVERY_FEE = 500;
const FREE_DELIVERY_FROM = 8000;

export default async function CartPage() {
  const { role } = await getSession();

  const lines = cart.flatMap((item) => {
    const product = getProduct(item.productId);
    return product ? [{ item, product }] : [];
  });
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.item.quantity, 0);
  const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  return (
    <div className="container section">
      <div className="page-head">
        <h1>Корзина</h1>
      </div>

      <div className="cart-layout">
        <div className="card">
          {lines.map(({ item, product }) => (
            <div key={`${item.productId}-${item.size ?? ""}`} className="cart-item">
              <div className="pic">
                <ProductImage src={product.image} emoji={product.emoji} alt={product.name} />
              </div>
              <div className="info">
                <h3>{product.name}</h3>
                <p className="muted small">{item.size ?? "Стандартная порция"}</p>
              </div>
              <div className="qty">
                <button type="button" aria-label="Уменьшить">
                  −
                </button>
                <span>{item.quantity}</span>
                <button type="button" aria-label="Увеличить">
                  +
                </button>
              </div>
              <div className="price" style={{ minWidth: 90, textAlign: "right" }}>
                {formatPrice(product.price * item.quantity)}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Удалить">
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className="card stack">
          <h3>Ваш заказ</h3>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input className="input" placeholder="Промокод" aria-label="Промокод" />
            <button type="button" className="btn btn-ghost">
              Применить
            </button>
          </div>
          <div>
            <div className="sum-row">
              <span className="muted">Товары</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="sum-row">
              <span className="muted">Доставка</span>
              <span>{delivery === 0 ? "бесплатно" : formatPrice(delivery)}</span>
            </div>
            <div className="sum-row sum-total">
              <span>Итого</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          {role === "guest" ? (
            <>
              <p className="small muted">Чтобы оформить заказ, войдите или зарегистрируйтесь.</p>
              <Link href="/login" className="btn btn-primary btn-block">
                Войти и оформить
              </Link>
            </>
          ) : role === "customer" ? (
            <button type="button" className="btn btn-primary btn-block">
              Оформить заказ
            </button>
          ) : (
            <p className="small muted">Оформление заказов доступно клиентам.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
