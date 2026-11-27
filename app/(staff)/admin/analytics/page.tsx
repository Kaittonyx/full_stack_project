import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AccessDenied from "@/components/AccessDenied";
import { SalesDetails, type Tab } from "@/components/SalesDetailsModal";
import { toFlat } from "@/lib/analytics";
import { getUser } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { getOrders } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";
import { buildRatingsReport } from "@/lib/reviews";

type SearchParams = Promise<{ tab?: string }>;
const TAB_IDS: Tab[] = ["overview", "dishes", "time", "ratings"];

export const metadata = { title: "Аналитика" };

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const { role } = await getSession();
  if (!canAccess(role, "/admin/analytics")) {
    return <AccessDenied allowed={routeRoles["/admin/analytics"]} />;
  }

  const { tab } = await searchParams;
  const initialTab = TAB_IDS.find((t) => t === tab) ?? "overview";

  const flat = toFlat(getOrders());
  const ratings = buildRatingsReport((id) => getUser(id)?.name ?? "Курьер");

  return (
    <>
      <Link href="/admin" className="back-link">
        <ArrowLeft size={16} />
        К сводке
      </Link>
      <div className="page-head">
        <h1>Аналитика</h1>
        <p className="muted">Продажи, блюда, время заказов и оценки клиентов.</p>
      </div>
      <div className="card">
        <SalesDetails key={initialTab} orders={flat} ratings={ratings} initialTab={initialTab} />
      </div>
    </>
  );
}