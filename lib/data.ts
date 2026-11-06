// Единая точка доступа к фейковым данным из data/*.json.
// Когда появится база данных, достаточно заменить эти экспорты на запросы Prisma.

import categoriesJson from "@/data/categories.json";
import productsJson from "@/data/products.json";
import ingredientsJson from "@/data/ingredients.json";
import usersJson from "@/data/users.json";
import ordersJson from "@/data/orders.json";
import cartJson from "@/data/cart.json";
import promosJson from "@/data/promos.json";
import type { CartItem, Category, Ingredient, Order, OrderItem, Product, User } from "./types";

export const categories = categoriesJson as Category[];
export const products = productsJson as Product[];
export const ingredients = ingredientsJson as Ingredient[];
export const users = usersJson as User[];
export const orders = ordersJson as Order[];
export const cart = cartJson as CartItem[];
export const promos = promosJson;

export function getUser(id: string | null): User | undefined {
  return users.find((u) => u.id === id);
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function itemsTotal(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function orderTotal(order: Order): number {
  return itemsTotal(order.items) + order.deliveryFee - order.discount;
}

export function cartCount(): number {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}
export function removeProduct(id: string) {
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products.splice(index, 1);
  }
}

export function addProduct(product: Product) {
  products.push(product);
}
