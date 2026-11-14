"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Периодически перерисовывает серверные данные страницы (новые заказы, смена статусов).
// Пока вкладка скрыта, не опрашивает сервер.
export default function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
