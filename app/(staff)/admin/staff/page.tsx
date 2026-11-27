import AccessDenied from "@/components/AccessDenied";
import ListFilters from "@/components/ListFilters";
import { users } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { canAccess, roleLabels, routeRoles } from "@/lib/permissions";
import { str, type SP } from "@/lib/list-query";
import type { EmployeeStatus, User } from "@/lib/types";


export const metadata = { title: "Сотрудники" };

type StaffSort = "name-asc" | "name-desc" | "role-asc" | "role-desc" | "email-asc" | "email-desc" | "phone-asc" | "phone-desc" | "status-asc" | "status-desc";

const staffStatusMeta: Record<EmployeeStatus, { label: string; badge: string }> = {
  working: { label: "Работает", badge: "badge-green" },
  vacation: { label: "В отпуске", badge: "badge-orange" },
  sick_leave: { label: "На больничном", badge: "badge-purple" },
  dismissed: { label: "Уволен", badge: "badge-gray" },
};

const sortOptions: { value: StaffSort; label: string }[] = [
  { value: "name-asc", label: "Имя (А-Я)" },
  { value: "name-desc", label: "Имя (Я-А)" },
  { value: "role-asc", label: "Роль (А-Я)" },
  { value: "role-desc", label: "Роль (Я-А)" },
  { value: "email-asc", label: "Email (А-Я)" },
  { value: "email-desc", label: "Email (Я-А)" },
  { value: "phone-asc", label: "Телефон (по возрастанию)" },
  { value: "phone-desc", label: "Телефон (по убыванию)" },
  { value: "status-asc", label: "Статус (А-Я)" },
  { value: "status-desc", label: "Статус (Я-А)" },
];

function isStaffSort(value: string): value is StaffSort {
  return sortOptions.some((option) => option.value === value);
}

function sortValue(user: User, sort: StaffSort): string {
  switch (sort) {
    case "name-asc":
    case "name-desc":
      return user.name;
    case "role-asc":
    case "role-desc":
      return roleLabels[user.role];
    case "email-asc":
    case "email-desc":
      return user.email;
    case "phone-asc":
    case "phone-desc":
      return user.phone;
    case "status-asc":
    case "status-desc":
      return staffStatusMeta[user.status ?? "working"].label;
  }
}

const roleOptions = Object.entries(roleLabels)
  .filter(([value]) => value !== "guest" && value !== "customer")
  .map(([value, label]) => ({ value, label: `Роль: ${label}` }));
const statusOptions = Object.entries(staffStatusMeta).map(([value, { label }]) => ({
  value,
  label: `Статус: ${label}`,
}));

export default async function StaffPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { role } = await getSession();
  if (!canAccess(role, "/admin/staff")) {
    return <AccessDenied allowed={routeRoles["/admin/staff"]} />;
  }

  const params = await searchParams;
  const requestedSort = str(params, "sort");
  const sort = isStaffSort(requestedSort) ? requestedSort : "name-asc";
  const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" });
  const staff = users
    .filter((u) => u.role !== "customer")
    .toSorted((left, right) => {
      const direction = sort.endsWith("-desc") ? -1 : 1;
      return (
        direction * collator.compare(sortValue(left, sort), sortValue(right, sort)) ||
        collator.compare(left.name, right.name)
      );
    });

  return (
    <>
      <div className="page-head">
        <h1>Сотрудники</h1>
        <p className="muted">Всего: {staff.length}</p>
      </div>

      <ListFilters
        options={[...roleOptions, ...statusOptions]}
        searchPlaceholder="Поиск по имени или email"
        sortOptions={sortOptions}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Email</th>
                <th>Телефон</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => {
                const status = u.status ?? "working";
                const statusMeta = staffStatusMeta[status];
                return (
                  <tr
                    key={u.id}
                    data-filter-item
                    data-filter={`${u.role} ${status}`}
                    data-search={`${u.name} ${u.email} ${u.phone} ${roleLabels[u.role]} ${statusMeta.label}`}
                  >
                    <td>
                      <span className="icon-row">
                        <span className="avatar">{u.name[0]}</span>
                        <strong>{u.name}</strong>
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue">{roleLabels[u.role]}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                    </td>
                    <td className="small muted">{u.email}</td>
                    <td className="small">{u.phone}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ListFilters>
    </>
  );
}