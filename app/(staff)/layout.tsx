import { Fragment } from "react";
import NavIcon from "@/components/NavIcon";
import SidebarLink from "@/components/SidebarLink";
import { getSession } from "@/lib/demo-session";
import { roleLabels, staffNav } from "@/lib/permissions";

// Общая обёртка кабинетов сотрудников: боковое меню по роли.
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
        {links.map((l, i) => (
          <Fragment key={l.href}>
            {l.group && l.group !== links[i - 1]?.group && <div className="sidebar-group">{l.group}</div>}
            <SidebarLink href={l.href} all={links.map((x) => x.href)}>
              {l.icon && <NavIcon name={l.icon} />}
              {l.label}
            </SidebarLink>
          </Fragment>
        ))}
      </aside>
      <section>{children}</section>
    </div>
  );
}