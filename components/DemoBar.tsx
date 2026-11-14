import { getSession } from "@/lib/demo-session";
import { users } from "@/lib/data";
import RoleSwitcher from "./RoleSwitcher";

// ВРЕМЕННАЯ демо-полоска над шапкой: переключатель ролей для показа интерфейсов.
// Удалить вместе с RoleSwitcher, когда будет настоящая авторизация.
export default async function DemoBar() {
  const { user } = await getSession();

  return (
    <div className="demo-bar">
      <div className="container demo-bar-inner">
        <RoleSwitcher
          currentId={user?.id ?? null}
          users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
        />
      </div>
    </div>
  );
}