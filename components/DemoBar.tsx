import { getSession } from "@/lib/demo-session";
import RoleSwitcher from "./RoleSwitcher";

// ВРЕМЕННАЯ демо-полоска над шапкой: переключатель ролей для показа интерфейсов.
// Удалить вместе с RoleSwitcher, когда будет настоящая авторизация.
export default async function DemoBar() {
  const { role } = await getSession();

  return (
    <div className="demo-bar">
      <div className="container demo-bar-inner">
        <RoleSwitcher current={role} />
      </div>
    </div>
  );
}