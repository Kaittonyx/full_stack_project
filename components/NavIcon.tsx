import { BarChart3, Bike, ChefHat, ClipboardList, Circle, Gamepad2, Pizza } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  admin: BarChart3,
  orders: ClipboardList,
  menu: Pizza,
  builder: Gamepad2,
  kitchen: ChefHat,
  delivery: Bike,
};

export default function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = icons[name] ?? Circle;
  return <Icon size={size} aria-hidden="true" />;
}