"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/demo-session";
import { canAccess } from "@/lib/permissions";
import { createPromo, deletePromo, setPromoActive } from "@/lib/promos";

export type PromoFormState = { ok: boolean; message: string };

async function allowed(): Promise<boolean> {
    const { role } = await getSession();
    return canAccess(role, "/admin");
}

export async function createPromoAction(_prev: PromoFormState, formData: FormData): Promise<PromoFormState> {
    if (!(await allowed())) return { ok: false, message: "Нет доступа" };

    const result = await createPromo({
        code: String(formData.get("code") ?? ""),
        kind: formData.get("kind") === "fixed" ? "fixed" : "percent",
        value: Number(formData.get("value")),
        minSubtotal: Number(formData.get("minSubtotal") || 0),
        firstOrderOnly: formData.get("firstOrderOnly") === "on",
        usageLimit: Number(formData.get("usageLimit") || 0),
        expiresAt: String(formData.get("expiresAt") ?? "").trim() || undefined,
    });

    if (!result.ok) return { ok: false, message: result.error };

    revalidatePath("/", "layout");
    return { ok: true, message: "Промокод создан" };
}

export async function togglePromoAction(formData: FormData) {
    if (!(await allowed())) return;
    await setPromoActive(String(formData.get("code") ?? ""), formData.get("active") === "on");
    revalidatePath("/", "layout");
}

export async function deletePromoAction(formData: FormData) {
    if (!(await allowed())) return;
    await deletePromo(String(formData.get("code") ?? ""));
    revalidatePath("/", "layout");
}