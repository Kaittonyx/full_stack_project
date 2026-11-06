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
  quantity: number;
  unitPrice: number;
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
}

export interface CartItem {
  productId: string;
  size?: string;
  quantity: number;
}
