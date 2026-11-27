"use client";

import { useActionState } from "react";
import { saveAddress, updateContacts, type FormState } from "@/lib/profile-actions";
import type { Address } from "@/lib/types";

const initial: FormState = { ok: false, message: "" };

export function ContactsForm({ email, phone }: { email: string; phone: string }) {
  const [state, action, pending] = useActionState(updateContacts, initial);

  return (
    <form action={action} className="dialog-form">
      <label>
        Email
        <input className="input" name="email" type="email" defaultValue={email} required autoComplete="email" />
      </label>
      <label>
        Телефон
        <input
          className="input"
          name="phone"
          type="tel"
          defaultValue={phone}
          placeholder="+7 701 123 45 67"
          required
          autoComplete="tel"
        />
      </label>
      {state.message && !state.ok && <p className="form-error">{state.message}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}

export function AddressForm({ address }: { address?: Address }) {
  const [state, action, pending] = useActionState(saveAddress, initial);

  return (
    <form action={action} className="dialog-form">
      {address && <input type="hidden" name="id" value={address.id} />}
      <label>
        Название
        <input className="input" name="label" defaultValue={address?.label} placeholder="Дом, Работа…" maxLength={30} required />
      </label>
      <label>
        Адрес
        <input
          className="input"
          name="line"
          defaultValue={address?.line}
          placeholder="Астана, ул. Сыганак, 10, кв. 5"
          maxLength={150}
          required
        />
      </label>
      <label>
        Комментарий для курьера (необязательно)
        <input
          className="input"
          name="comment"
          defaultValue={address?.comment}
          placeholder="Подъезд 3, домофон 56"
          maxLength={150}
        />
      </label>
      {state.message && !state.ok && <p className="form-error">{state.message}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить адрес"}
      </button>
    </form>
  );
}