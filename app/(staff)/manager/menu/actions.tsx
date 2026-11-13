"use server";

import { revalidatePath } from "next/cache";
import { addProduct, removeProduct } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { canAccess } from "@/lib/permissions";

export async function deleteProduct(formData: FormData) {
  const { role } = await getSession();
  if (!canAccess(role, "/manager/menu")) return;

  const id = String(formData.get("id"));
  removeProduct(id);

  revalidatePath("/", "layout");
}
export async function createProduct(formData: FormData) {
  const { role } = await getSession();
  if (!canAccess(role, "/manager/menu")) return;

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const emoji = "";
  const image = String(formData.get("image") ?? "").trim() || undefined;
  const categoryId = String(formData.get("categoryId"));
  const sizes = String(formData.get("sizes") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name || !price) return;

  addProduct({
    id: `p-${Date.now()}`,
    categoryId,
    name,
    description,
    price,
    image,
    emoji,
    ingredients: [],
    sizes: sizes.length ? sizes : undefined,
    isAvailable: true,
    isPopular: false,
  });

  revalidatePath("/", "layout");
}