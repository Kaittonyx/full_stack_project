import type { Role } from "./permissions";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "ASSIGNED_TO_COURIER"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  image?: string;
  ingredients: string[];
  sizes?: string[];
  isAvailable: boolean;
  isPopular: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  type: "sauce" | "cheese" | "meat" | "vegetable";
  price: number;
  emoji: string;
  isAvailable: boolean;
}

export interface Address {
  id: string;
  label: string;
  line: string;
  comment: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Exclude<Role, "guest">;
  addresses?: Address[];
}

export interface OrderItem {
  name: string;
  size?: string;
  details?: string; // тесто, допы, «без ...» — повар видит это на кухне
  quantity: number;
  unitPrice: number;
}

export interface StatusChange {
  status: OrderStatus;
  at: string;
  by?: string; // id пользователя, сменившего статус
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  deliveryFee: number;
  discount: number;
  paymentMethod: string;
  address: string;
  addressComment: string;
  comment: string;
  courierId: string | null;
  history?: StatusChange[];
}

// Строка корзины. Цена НЕ хранится: сервер пересчитывает её при показе и при оформлении.
export interface CartItem {
  key: string; // уникальный ключ комбинации товара и опций
  kind?: "product" | "custom"; // custom — пицца из конструктора
  productId?: string;
  size?: string;
  dough?: string;
  extras?: string[];
  removed?: string[];
  recipe?: PizzaRecipeInput; // только для custom
  quantity: number;
}

export interface PizzaRecipeInput {
  doughId: string;
  size: number;
  sauceId: string | null;
  cheeseIds: string[];
  toppings: { ingredientId: string; count: number }[];
}
