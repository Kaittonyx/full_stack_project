"use client";

import { useActionState } from "react";
import { createPromoAction, type PromoFormState } from "@/lib/promo-actions";

const initial: PromoFormState = { ok: false, message: "" };

export default function PromoCreateForm() {
    const [state, action, pending] = useActionState(createPromoAction, initial);

    return (
        <form action={action} className="dialog-form">
            <label>
                Код
                <input className="input" name="code" placeholder="Например, SALE20" maxLength={20} required />
            </label>

            <div className="form-two">
                <label>
                    Тип скидки
                    <select className="select" name="kind" defaultValue="percent">
                        <option value="percent">Процент (%)</option>
                        <option value="fixed">Сумма (₸)</option>
                    </select>
                </label>
                <label>
                    Размер скидки
                    <input className="input" name="value" type="number" min={1} required />
                </label>
            </div>

            <div className="form-two">
                <label>
                    Минимальный заказ, ₸
                    <input className="input" name="minSubtotal" type="number" min={0} defaultValue={0} />
                </label>
                <label>
                    Лимит использований
                    <input className="input" name="usageLimit" type="number" min={0} defaultValue={0} />
                </label>
            </div>

            <label>
                Действует до (необязательно)
                <input className="input" name="expiresAt" type="date" />
            </label>

            <label className="check">
                <input type="checkbox" name="firstOrderOnly" />
                Только на первый заказ клиента
            </label>

            {state.message && <p className={state.ok ? "form-ok" : "form-error"}>{state.message}</p>}

            <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Создаём…" : "Создать промокод"}
            </button>
        </form>
    );
}