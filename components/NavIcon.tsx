import { BarChart3, Bike, ChefHat, ClipboardList, Circle, Gamepad2, LayoutDashboard, Pizza, Tag, Users, LineChart} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  admin: BarChart3,
  orders: ClipboardList,
  cabinet: LayoutDashboard,
  menu: Pizza,
  builder: Gamepad2,
  kitchen: ChefHat,
  delivery: Bike,
  staff: Users,
  analytics: LineChart,
  promos: Tag,
};

export default function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = icons[name] ?? Circle;
  return <Icon size={size} aria-hidden="true" />;
}