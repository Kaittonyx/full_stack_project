"use server";

import { revalidatePath } from "next/cache";
import { createProductInDb, deleteProductFromDb, updateProductInDb } from "@/lib/products-db";
import { getSession } from "@/lib/demo-session";
import { canAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";

export async function deleteProduct(formData: FormData) {
  const { role } = await getSession();
  if (!canAccess(role, "/manager/menu")) return;

  const id = String(formData.get("id"));
  await deleteProductFromDb(id);

  revalidatePath("/", "layout");
}

export async function createProduct(formData: FormData) {
  const { role } = await getSession();
  if (!canAccess(role, "/manager/menu")) return;

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const emoji = String(formData.get("emoji") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim() || undefined;
  const categoryId = String(formData.get("categoryId"));
  const sizes = String(formData.get("sizes") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  if (!name || !price) return;

  await createProductInDb({
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
export async function updateProduct(formData: FormData) {
  const { role } = await getSession();
  if (!canAccess(role, "/manager/menu")) return;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!id || !name || !price) return;

  const sizes = String(formData.get("sizes") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  await updateProductInDb(id, {
    categoryId: String(formData.get("categoryId") ?? ""),
    name,
    description: String(formData.get("description") ?? "").trim(),
    price,
    emoji: String(formData.get("emoji") ?? ""),
    image: String(formData.get("image") ?? "").trim() || undefined,
    sizes: sizes.length ? sizes : undefined,
    isAvailable: formData.get("isAvailable") === "on",
    isPopular: formData.get("isPopular") === "on",
  });

  revalidatePath("/", "layout");
}
export async function deleteProductAndGoBack(formData: FormData) {
  const { role } = await getSession();
  if (!canAccess(role, "/manager/menu")) return;

  await deleteProductFromDb(String(formData.get("id") ?? ""));

  revalidatePath("/", "layout");
  redirect("/manager/menu");
}