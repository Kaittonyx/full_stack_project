import { formatTime } from "@/lib/labels";
import type { Order, OrderStatus } from "@/lib/types";

const steps: { status: OrderStatus; label: string }[] = [
  { status: "CONFIRMED", label: "Принят" },
  { status: "PREPARING", label: "Готовится" },
  { status: "ASSIGNED_TO_COURIER", label: "Курьер назначен" },
  { status: "OUT_FOR_DELIVERY", label: "В пути" },
  { status: "DELIVERED", label: "Доставлен" },
];

// READY — короткая промежуточная точка между кухней и курьером, на шкале её не показываем
function rank(s: OrderStatus): number {
  const order: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY", "DELIVERED"];
  return order.indexOf(s);
}

export default function OrderProgress({ order }: { order: Order }) {
  if (order.status === "CANCELLED") return null;
  const current = rank(order.status);
  return (
    <ol className="steps">
      {steps.map((st) => {
        const reached = current >= rank(st.status);
        const at = order.history?.find((h) => h.status === st.status)?.at;
        return (
          <li key={st.status} className={reached ? "step done" : "step"}>
            <span className="dot" />
            <span>{st.label}</span>
            {reached && at && <span className="muted small">{formatTime(at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
