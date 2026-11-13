import { cookies } from "next/headers";
import { users } from "./data";
import type { Role } from "./permissions";
import type { User } from "./types";

// ДЕМО: пользователь берётся из cookie "demo_user" (id из data/users.json),
// которую выставляет переключатель в шапке. Это заглушка вместо настоящего входа
// (сессии, пароли — задача разработчика №1). Весь остальной код получает пользователя
// только через getSession(), так что при появлении реальной авторизации
// достаточно заменить эту функцию.
export async function getSession(): Promise<{ role: Role; user: User | null }> {
  const store = await cookies();
  const id = store.get("demo_user")?.value;
  const user = users.find((u) => u.id === id) ?? null;
  return { role: user ? user.role : "guest", user };
}
