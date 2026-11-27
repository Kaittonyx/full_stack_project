import AccessDenied from "@/components/AccessDenied";
import ListFilters from "@/components/ListFilters";
import { users } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { canAccess, roleLabels, routeRoles } from "@/lib/permissions";


export const metadata = { title: "Сотрудники" };
export default async function StaffPage() {
  const { role } = await getSession();
  if (!canAccess(role, "/admin/staff")) {
    return <AccessDenied allowed={routeRoles["/admin/staff"]} />;
  }

  const staff = users.filter((u) => u.role !== "customer");

  return (
    <>
      <div className="page-head">
        <h1>Сотрудники</h1>
        <p className="muted">Всего: {staff.length}</p>
      </div>

      <ListFilters
        options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))}
        searchPlaceholder="Поиск по имени или email"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Роль</th>
                <th>Email</th>
                <th>Телефон</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} data-filter-item data-filter={u.role} data-search={`${u.name} ${u.email}`}>
                  <td>
                    <span className="icon-row">
                      <span className="avatar">{u.name[0]}</span>
                      <strong>{u.name}</strong>
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-blue">{roleLabels[u.role]}</span>
                  </td>
                  <td className="small muted">{u.email}</td>
                  <td className="small">{u.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ListFilters>
    </>
  );
}