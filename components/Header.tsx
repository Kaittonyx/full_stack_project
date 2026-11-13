import Link from "next/link";
import { getSession } from "@/lib/demo-session";
import { getCartCount } from "@/lib/cart";
import { users } from "@/lib/data";
import { roleLabels, staffNav } from "@/lib/permissions";
import RoleSwitcher from "./RoleSwitcher";
import ThemeToggle from "./ThemeToggle";
import {
    Pizza,
    ShoppingCart,
    UserRound,
    LogIn,
    UserPlus, UserCircle,
} from "lucide-react";

export default async function Header() {
  const { role, user } = await getSession();
  const isShopper = role === "guest" || role === "customer";
  const count = isShopper ? await getCartCount() : 0;
  const links = isShopper
    ? [
        { href: "/catalog", label: "Меню" },
        { href: "/builder", label: "Конструктор" },
        ...(role === "customer" ? [{ href: "/orders", label: "Мои заказы" }] : []),
      ]
    : [{ href: "/catalog", label: "Меню" }, ...staffNav[role]];

  return (
    <header className="header">
      <div className="container header-inner">
          <Link href="/" className="logo">
              <Pizza size={27} strokeWidth={2.2} />
              LINK <span> Pizza</span>
          </Link>



        <nav className="nav" aria-label="Основная навигация">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <ThemeToggle />
          <RoleSwitcher
            currentId={user?.id ?? null}
            users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
          />

          {isShopper && (
            <Link href="/cart" className="cart-link">
                <ShoppingCart size={19} />
                Корзина
                <span className="cart-count">{count}</span>
            </Link>
          )}

          {user ? (
            <Link href="/profile" className="user-chip" title={roleLabels[role]}>
              <span className="avatar">
                  <UserRound size={18} />
              </span>
              {user.name.split(" ")[0]}
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                  <LogIn size={16} />
                Войти
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                  <UserPlus size={16} />
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
