// Хранилище заказов и корзин в JSON-файле .data/db.json.
// Это временная замена базе данных: переживает перезапуск сервера и hot reload.
// Когда появится Prisma, нужно переписать только этот файл и lib/orders.ts.
// Работает только там, где есть запись на диск (локальный запуск, VPS), на Vercel — нет.

import fs from "node:fs";
import path from "node:path";
import type { CartItem, Order } from "./types";

export interface StoredCart {
  items: CartItem[];
  promo?: string;
}

export interface Db {
  counter: number; // для номеров заказов LP-1001, LP-1002, ...
  orders: Order[];
  carts: Record<string, StoredCart>;
}

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

function load(): Db {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as Partial<Db>;
    return {
      counter: parsed.counter ?? 1000,
      orders: parsed.orders ?? [],
      carts: parsed.carts ?? {},
    };
  } catch {
    return { counter: 1000, orders: [], carts: {} };
  }
}

function save(db: Db) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE); // запись через временный файл, чтобы не получить половину JSON
}

export function readDb<T>(fn: (db: Db) => T): T {
  return fn(load());
}

// Операции синхронные, поэтому read-modify-write внутри одного процесса не пересекается.
export function mutateDb<T>(fn: (db: Db) => T): T {
  const db = load();
  const result = fn(db);
  save(db);
  return result;
}
