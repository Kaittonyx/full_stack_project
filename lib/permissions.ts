// Роли и доступ к разделам (только для UI-демо).
// Реальная проверка прав будет на сервере — см. раздел 6 ТЗ.

export const roles = ["guest", "customer", "cook", "courier", "manager", "admin"] as const;
export type Role = (typeof roles)[number];

export function isRole(value: string | undefined): value is Role {
  return roles.some((r) => r === value);
}

export const roleLabels: Record<Role, string> = {
  guest: "Гость",
  customer: "Клиент",
  cook: "Повар",
  courier: "Курьер",
  manager: "Менеджер",
  admin: "Администратор",
};

// Куда попадает пользователь после выбора роли
export const roleHome: Record<Role, string> = {
  guest: "/",
  customer: "/",
  cook: "/kitchen",
  courier: "/courier",
  manager: "/manager",
  admin: "/admin",
};

// Какие роли могут открыть раздел (по матрице доступа из ТЗ)
export const routeRoles: Record<string, Role[]> = {
  "/kitchen": ["cook", "manager", "admin"],
  "/courier": ["courier", "manager", "admin"],
  "/manager": ["manager", "admin"],
  "/manager/menu": ["manager", "admin"],
  "/admin": ["admin"],
  "/profile": ["customer", "cook", "courier", "manager", "admin"],
  "/orders": ["customer"],
  "/checkout": ["customer"],
};

export function canAccess(role: Role, path: string): boolean {
  const allowed = routeRoles[path];
  return !allowed || allowed.includes(role);
}



export type NavLink = { href: string; label: string; icon?: string };
export const staffNav: Record<Role, NavLink[]> = {
  guest: [],
  customer: [],
  cook: [{ href: "/kitchen", label: "Кухня", icon: "kitchen" }],
  courier: [{ href: "/courier", label: "Доставки", icon: "delivery" }],
  manager: [
    { href: "/manager", label: "Заказы", icon: "orders" },
    { href: "/manager/menu", label: "Меню", icon: "menu" },
    { href: "/kitchen", label: "Кухня", icon: "kitchen" },
    { href: "/courier", label: "Доставки", icon: "delivery" },
  ],
  admin: [
    { href: "/admin", label: "Админ-панель", icon: "admin" },
    { href: "/manager", label: "Заказы", icon: "orders" },
    { href: "/manager/menu", label: "Меню", icon: "menu" },
    { href: "/kitchen", label: "Кухня", icon: "kitchen" },
    { href: "/courier", label: "Доставки", icon: "delivery" },
  ],
};
