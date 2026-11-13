import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import StatusBadge from "@/components/StatusBadge";
import { categories, products, promos } from "@/lib/data";
import { getOrdersByCustomer } from "@/lib/orders";
import { getSession } from "@/lib/demo-session";
import { roleHome, roleLabels } from "@/lib/permissions";
import { formatTime } from "@/lib/labels";
import {
  Pizza,
  Gamepad2,
  Clock3,
  MapPin,
  CreditCard,
  Truck,
  Gift,
  Flame,
  Percent,
} from "lucide-react";

import CategoryIcon from "@/components/CategoryIcon";

const promoIcons = [Gift, Percent, Flame];
export default async function HomePage() {
  const { role, user } = await getSession();
  const popular = products.filter((p) => p.isPopular).slice(0, 4);
  const isStaff = role !== "guest" && role !== "customer";
  const activeOrder =
    role === "customer"
      ? getOrdersByCustomer(user?.id ?? "").find(
          (o) => !["DELIVERED", "CANCELLED"].includes(o.status),
        )
      : undefined;

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <h1>
              {user && role === "customer"
                ? `Привет, ${user.name.split(" ")[0]}! Чего хочется сегодня?`
                : "Горячая пицца с доставкой за 40 минут"}
            </h1>
            <p className="lead">
              Выбирайте из меню или соберите собственную пиццу в конструкторе: тесто, соус, сыр и
              любимые добавки.
            </p>
            <div className="row">
              <Link href="/catalog" className="btn btn-primary">
                Смотреть меню
              </Link>
              <Link href="/builder" className="btn btn-ghost">
                <Gamepad2 size={18} />
                 Собрать свою пиццу
              </Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <Pizza size={120} strokeWidth={1.3} />
          </div>
        </div>
      </section>

      {isStaff && user && (
        <div className="container">
          <div className="notice">
            <span>
              Вы вошли как <strong>{roleLabels[role]}</strong> ({user.name}).
            </span>
            <Link href={roleHome[role]} className="btn btn-primary btn-sm">
              Открыть рабочий кабинет
            </Link>
          </div>
        </div>
      )}

      {activeOrder && (
        <div className="container">
          <div className="notice">
            <span>
              Ваш заказ <strong>{activeOrder.number}</strong> от {formatTime(activeOrder.createdAt)}:{" "}
              <StatusBadge status={activeOrder.status} />
            </span>
            <Link href="/profile" className="btn btn-ghost btn-sm">
              Отследить
            </Link>
          </div>
        </div>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Категории</h2>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {categories.map((c) => (
              <Link
                  key={c.id}
                  href={`/catalog?category=${c.slug}`}
                  className="card category-tile"
                >
                <CategoryIcon name={c.name} size={32} />
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Популярное</h2>
            <Link href="/catalog" className="muted">
              Всё меню →
            </Link>
          </div>
          <div className="grid grid-4">
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} id="promo">
        <div className="container">
          <div className="section-head">
            <h2>Акции и предложения</h2>
          </div>
          <div className="grid grid-3">
            {promos.banners.map((b, index) => {
              const Icon = promoIcons[index % promoIcons.length];

              return (
                  <div key={b.id} className={`banner banner-${b.tone}`}>
                    <Icon size={36} strokeWidth={1.8} />

                    <div>
                      <h3>{b.title}</h3>
                      <p className="small muted">{b.text}</p>
                    </div>
                  </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Как работает доставка</h2>
          </div>
          <div className="card facts">
            <div className="fact">
              <Clock3 size={32} />
              <div>
                <h3>40 минут</h3>
                <p className="small muted">Среднее время от заказа до двери.</p>
              </div>
            </div>
            <div className="fact">
              <MapPin size={32} />
              <div>
                <h3>По всему городу</h3>
                <p className="small muted">Доставка от 500 ₸, бесплатно от 8 000 ₸.</p>
              </div>
            </div>
            <div className="fact">
              <CreditCard size={32} />
              <div>
                <h3>Удобная оплата</h3>
                <p className="small muted">Картой онлайн или наличными курьеру.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
