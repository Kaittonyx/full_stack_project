import Link from "next/link";
import NavIcon from "@/components/NavIcon";
import { getSession } from "@/lib/demo-session";
import { roleLabels, staffNav } from "@/lib/permissions";
import SidebarLink from "@/components/SidebarLink";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getSession();
  const links = staffNav[role];

  if (links.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className="container staff-layout">
      <aside className="sidebar" aria-label="Меню сотрудника">
        <div className="sidebar-title">{roleLabels[role]}</div>
        {links.map((l) => (
            <SidebarLink key={l.href} href={l.href}>
                {l.icon && <NavIcon name={l.icon} />}
                {l.label}
            </SidebarLink>
        ))}
      </aside>
      <section>{children}</section>
    </div>
  );
}