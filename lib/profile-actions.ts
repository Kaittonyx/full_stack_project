"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/demo-session";
import { getProfile, isEmail, normalizePhone, saveAddresses, saveContacts } from "@/lib/profiles";

export type FormState = { ok: boolean; message: string };

export async function updateContacts(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await getSession();
  if (!user) return { ok: false, message: "Войдите в аккаунт" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!isEmail(email)) return { ok: false, message: "Проверьте email, например name@mail.kz" };
  if (!phone) return { ok: false, message: "Телефон: 11 цифр, например +7 701 123 45 67" };

  saveContacts(user.id, email, phone);
  revalidatePath("/profile");
  return { ok: true, message: "Контакты сохранены" };
}

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const { role, user } = await getSession();
  if (!user || role !== "customer") return { ok: false, message: "Нет доступа" };

  const label = String(formData.get("label") ?? "").trim().slice(0, 30);
  const line = String(formData.get("line") ?? "").trim().slice(0, 150);
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 150);
  const id = String(formData.get("id") ?? "");

  if (!label) return { ok: false, message: "Укажите название, например «Дом»" };
  if (line.length < 5) return { ok: false, message: "Укажите адрес полностью: улица, дом, квартира" };

  const list = getProfile(user).addresses ?? [];
  if (!id && list.length >= 5) return { ok: false, message: "Можно сохранить не больше 5 адресов" };

  const next = id
    ? list.map((a) => (a.id === id ? { ...a, label, line, comment } : a))
    : [...list, { id: `a-${Date.now()}`, label, line, comment }];

  saveAddresses(user.id, next);
  revalidatePath("/profile");
  return { ok: true, message: "Адрес сохранён" };
}

export async function deleteAddress(formData: FormData) {
  const { role, user } = await getSession();
  if (!user || role !== "customer") return;

  const id = String(formData.get("id") ?? "");
  saveAddresses(
    user.id,
    (getProfile(user).addresses ?? []).filter((a) => a.id !== id),
  );
  revalidatePath("/profile");
}