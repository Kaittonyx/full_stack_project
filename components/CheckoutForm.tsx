"use client";

import { useActionState, useState } from "react";
import { placeOrder } from "@/lib/order-actions";
import { paymentMethods } from "@/lib/menu";
import type { Address } from "@/lib/types";

export default function CheckoutForm({ addresses }: { addresses: Address[] }) {
  const [state, action, pending] = useActionState(placeOrder, {});
  const [address, setAddress] = useState(addresses[0]?.line ?? "");
  const [addressComment, setAddressComment] = useState(addresses[0]?.comment ?? "");

  function pickSaved(id: string) {
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setAddress(a.line);
    setAddressComment(a.comment);
  }

  return (
    <form action={action} className="card stack">
      <h3>Доставка</h3>

      {addresses.length > 0 && (
        <div className="field">
          <label htmlFor="saved">Сохранённые адреса</label>
          <select id="saved" className="select" defaultValue={addresses[0].id} onChange={(e) => pickSaved(e.target.value)}>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}: {a.line}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="address">Адрес</label>
        <input
          id="address"
          name="address"
          className="input"
          required
          maxLength={200}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Город, улица, дом, квартира"
        />
      </div>
      <div className="field">
        <label htmlFor="addressComment">Комментарий к адресу</label>
        <input
          id="addressComment"
          name="addressComment"
          className="input"
          maxLength={200}
          value={addressComment}
          onChange={(e) => setAddressComment(e.target.value)}
          placeholder="Подъезд, этаж, домофон"
        />
      </div>

      <div className="field">
        <label htmlFor="paymentMethod">Оплата</label>
        <select id="paymentMethod" name="paymentMethod" className="select" defaultValue={paymentMethods[0]}>
          {paymentMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="comment">Комментарий к заказу</label>
        <input id="comment" name="comment" className="input" maxLength={300} placeholder="Пожелания для кухни" />
      </div>

      {state.error && (
        <p className="notice" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Отправляем…" : "Заказать"}
      </button>
    </form>
  );
}
