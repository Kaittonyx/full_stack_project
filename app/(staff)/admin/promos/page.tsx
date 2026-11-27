import AccessDenied from "@/components/AccessDenied";
import PromoManager from "@/components/PromoManager";
import { getSession } from "@/lib/demo-session";
import { canAccess, routeRoles } from "@/lib/permissions";
import { getPromos } from "@/lib/promos";

export const metadata = { title: "Промокоды" };
export default async function PromosPage() {
  const { role } = await getSession();
  if (!canAccess(role, "/admin/promos")) {
    return <AccessDenied allowed={routeRoles["/admin/promos"]} />;
  }

  return <PromoManager promos={getPromos()} />;
}