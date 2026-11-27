import Link from "next/link";
import { ArrowRight, Briefcase, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import AccessDenied from "@/components/AccessDenied";
import ModalButton from "@/components/ModalButton";
import { AddressForm, ContactsForm } from "@/components/ProfileForms";
import StarRating from "@/components/StarRating";
import StatusBadge from "@/components/StatusBadge";
import { buildSalesReport, dayKeyOf, toFlat, todayKey } from "@/lib/analytics";
import { orderTotal } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { getOrders, getOrdersByCustomer, isFinal } from "@/lib/orders";
import { canAccess, roleHome, roleLabels, routeRoles } from "@/lib/permissions";
import { plural } from "@/lib/plural";
import { deleteAddress } from "@/lib/profile-actions";
import { getProfile } from "@/lib/profiles";
import type { ReactNode } from "react";
import { getReviews } from "@/lib/reviews";

export const metadata = { title: "Личный кабинет" };

type Tile = { label: string; value: string; hint?: string };

export default async function ProfilePage() {
  const { role, user } = await getSession();

  if (!user || !canAccess(role, "/profile")) {
    return <AccessDenied allowed={routeRoles["/profile"]} />;
  }

  const profile = getProfile(user);
  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const all = getOrders();
  const today = todayKey();
  const isToday = (iso: string) => dayKeyOf(iso) === today;
  const mine = all.flatMap((o) => (o.history ?? []).filter((h) => h.by === user.id));
  const count = (status: string, onlyToday = false) =>
    mine.filter((h) => h.status === status && (!onlyToday || isToday(h.at))).length;

  let tiles: Tile[] = [];
  let extra: ReactNode = null;
  const myOrders = role === "customer" ? getOrdersByCustomer(user.id) : [];

  if (role === "customer") {
    const paid = myOrders.filter((o) => o.status !== "CANCELLED");
    const dishes = new Map<string, number>();
    for (const o of paid) for (const i of o.items) dishes.set(i.name, (dishes.get(i.name) ?? 0) + i.quantity);
    const favorite = [...dishes.entries()].sort((a, b) => b[1] - a[1])[0];
    tiles = [
      { label: "Заказов", value: String(myOrders.length) },
      { label: "Потрачено", value: formatPrice(paid.reduce((s, o) => s + orderTotal(o), 0)) },
      { label: "Любимое блюдо", value: favorite ? favorite[0] : "—", hint: favorite ? `${favorite[1]} шт.` : undefined },
    ];
  }

  if (role === "cook") {
    tiles = [
      { label: "Принято сегодня", value: String(count("PREPARING", true)) },
      { label: "Приготовлено сегодня", value: String(count("READY", true)) },
      { label: "Приготовлено всего", value: String(count("READY")) },
    ];
  }

  if (role === "courier") {
    const ratings = getReviews().filter((r) => r.kind === "delivery" && r.courierId === user.id);
    const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
    tiles = [
      { label: "Доставлено сегодня", value: String(count("DELIVERED", true)) },
      { label: "Доставлено всего", value: String(count("DELIVERED")) },
      {
        label: "Оценка клиентов",
        value: ratings.length ? avg.toFixed(1) : "—",
        hint: ratings.length ? `${ratings.length} ${plural(ratings.length, "оценка", "оценки", "оценок")}` : "Пока нет оценок",
      },
    ];
    if (ratings.length) extra = <StarRating value={avg} size={18} />;
  }

  if (role === "manager") {
    tiles = [
      { label: "Заказов в работе", value: String(all.filter((o) => !isFinal(o.status)).length) },
      { label: "Назначено курьеров", value: String(count("ASSIGNED_TO_COURIER")) },
      { label: "Отменено заказов", value: String(count("CANCELLED")) },
    ];
  }

  if (role === "admin") {
    const r = buildSalesReport(toFlat(all), today, today);
    tiles = [
      { label: "Заказов сегодня", value: String(r.orders) },
      { label: "Выручка сегодня", value: formatPrice(r.revenue) },
      { label: "В работе", value: String(all.filter((o) => !isFinal(o.status)).length) },
    ];
  }

  return (
    <div className="container section">
      <div className="card profile-hero">
        <span className="avatar-xl">{initials}</span>
        <div className="profile-hero-info">
          <h1>{profile.name}</h1>
          <div className="row" style={{ gap: 8 }}>
            <span className="badge badge-red">{roleLabels[role]}</span>
            {extra}
          </div>
        </div>
        {role !== "customer" && (
          <Link href={roleHome[role]} className="btn btn-primary">
            <Briefcase size={16} />
            Рабочий кабинет
          </Link>
        )}
      </div>

      <div className="profile-grid">
        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3>Контакты</h3>
            <ModalButton
              label={
                <>
                  <Pencil size={14} />
                  Изменить
                </>
              }
              title="Изменить контакты"
              resetKey={`${profile.email}|${profile.phone}`}
            >
              <ContactsForm email={profile.email} phone={profile.phone} />
            </ModalButton>
          </div>
          <div className="contact-row">
            <span className="contact-icon">
              <Mail size={18} />
            </span>
            <div>
              <div className="muted small">Email</div>
              <strong>{profile.email}</strong>
            </div>
          </div>
          <div className="contact-row">
            <span className="contact-icon">
              <Phone size={18} />
            </span>
            <div>
              <div className="muted small">Телефон</div>
              <strong>{profile.phone}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>{role === "customer" ? "Мои итоги" : "Моя работа"}</h3>
          <div className="stat-tiles">
            {tiles.map((t) => (
              <div key={t.label} className="stat-tile">
                <span className="muted small">{t.label}</span>
                <strong>{t.value}</strong>
                {t.hint && <span className="muted small">{t.hint}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {role === "customer" && (
        <div className="profile-grid">
          <div className="card">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <h3>Адреса доставки</h3>
              {(profile.addresses?.length ?? 0) < 5 && (
                <ModalButton
                  label={
                    <>
                      <Plus size={14} />
                      Добавить
                    </>
                  }
                  title="Новый адрес"
                  resetKey={String(profile.addresses?.length ?? 0)}
                >
                  <AddressForm />
                </ModalButton>
              )}
            </div>

            {(profile.addresses?.length ?? 0) === 0 && <p className="muted">Адресов пока нет</p>}

            <div className="addr-list">
              {profile.addresses?.map((a) => (
                <div key={a.id} className="addr-card">
                  <span className="contact-icon">
                    <MapPin size={18} />
                  </span>
                  <div className="addr-info">
                    <strong>{a.label}</strong>
                    <span>{a.line}</span>
                    {a.comment && <span className="muted small">{a.comment}</span>}
                  </div>
                  <div className="addr-actions">
                    <ModalButton
                      label={<Pencil size={14} />}
                      title={`Изменить адрес «${a.label}»`}
                      className="icon-btn"
                      resetKey={JSON.stringify(a)}
                    >
                      <AddressForm address={a} />
                    </ModalButton>
                    <ModalButton label={<Trash2 size={14} />} title="Удалить адрес?" className="icon-btn" resetKey={a.id}>
                      <p>Адрес «{a.label}» будет удалён.</p>
                      <form action={deleteAddress} className="dialog-form" style={{ marginTop: 16 }}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="btn btn-primary">
                          Да, удалить
                        </button>
                      </form>
                    </ModalButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <h3>Последние заказы</h3>
              {myOrders.length > 0 && (
                <Link href="/orders" className="btn btn-ghost btn-sm">
                  Все заказы
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {myOrders.length === 0 ? (
              <div className="stack" style={{ alignItems: "flex-start" }}>
                <p className="muted">Заказов пока нет</p>
                <Link href="/catalog" className="btn btn-primary btn-sm">
                  Выбрать в меню
                </Link>
              </div>
            ) : (
              <div className="addr-list">
                {myOrders.slice(0, 3).map((o) => (
                  <Link key={o.id} href="/orders" className="order-mini">
                    <div className="row-between">
                      <strong>{o.number}</strong>
                      <StatusBadge status={o.status} />
                    </div>
                    <span className="muted small">
                      {formatDate(o.createdAt)}, {formatTime(o.createdAt)}
                    </span>
                    <div className="row-between">
                      <span className="small order-mini-items">{o.items.map((i) => i.name).join(", ")}</span>
                      <strong>{formatPrice(orderTotal(o))}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}