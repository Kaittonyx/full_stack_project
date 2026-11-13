"use client";

import { useActionState } from "react";
import { applyPromo } from "@/lib/cart-actions";

export default function PromoForm({ current }: { current?: string }) {
  const [state, action, pending] = useActionState(applyPromo, { ok: true, message: "" });
  return (
    <form action={action} className="stack" style={{ gap: 6 }}>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <input
          className="input"
          name="code"
          placeholder="Промокод"
          aria-label="Промокод"
          defaultValue={current ?? ""}
        />
        <button type="submit" className="btn btn-ghost" disabled={pending}>
          Применить
        </button>
      </div>
      {state.message && (
        <p className="small" style={{ color: state.ok ? "var(--green, #2e9d57)" : "var(--red, #d23a22)" }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
