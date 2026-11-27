import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Address, User } from "./types";

const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "profiles.json");

type Override = { email?: string; phone?: string; addresses?: Address[] };

function read(): Record<string, Override> {
  try {
    if (!existsSync(FILE)) return {};
    return JSON.parse(readFileSync(FILE, "utf-8")) as Record<string, Override>;
  } catch {
    return {};
  }
}

function write(all: Record<string, Override>) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(all, null, 2), "utf-8");
}

export function getProfile(user: User): User {
  const o = read()[user.id] ?? {};
  return {
    ...user,
    email: o.email ?? user.email,
    phone: o.phone ?? user.phone,
    addresses: o.addresses ?? user.addresses ?? [],
  };
}

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 10) d = `7${d}`;
  if (d.length !== 11) return null;
  if (d[0] === "8") d = `7${d.slice(1)}`;
  if (d[0] !== "7") return null;
  return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
}

export function saveContacts(userId: string, email: string, phone: string): void {
  const all = read();
  all[userId] = { ...all[userId], email, phone };
  write(all);
}

export function saveAddresses(userId: string, addresses: Address[]): void {
  const all = read();
  all[userId] = { ...all[userId], addresses };
  write(all);
}