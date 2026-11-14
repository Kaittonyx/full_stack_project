"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { roleHome, roleLabels, type Role } from "@/lib/permissions";

interface DemoUser {
  id: string;
  name: string;
  role: Exclude<Role, "guest">;
}

// ДЕМО-переключатель пользователя для показа интерфейсов и проверки цепочки заказа.
// Удалить, когда будет настоящая авторизация.
export default function RoleSwitcher({ currentId, users }: { currentId: string | null; users: DemoUser[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value;
    const target = users.find((u) => u.id === id);
    if (target) {
      document.cookie = `demo_user=${target.id}; path=/; max-age=86400; samesite=lax`;
    } else {
      document.cookie = "demo_user=; path=/; max-age=0; samesite=lax";
    }
    startTransition(() => {
      router.push(target ? roleHome[target.role] : "/");
      router.refresh();
    });
  }

  return (
    <label className="role-switcher" title="Демо: выберите пользователя, чтобы увидеть его интерфейс">
      Демо-вход
      <select value={currentId ?? ""} onChange={handleChange} disabled={pending}>
        <option value="">Гость</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {roleLabels[u.role]}
          </option>
        ))}
      </select>
    </label>
  );
}
