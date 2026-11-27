import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";

type JsonProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  emoji?: string;
  image?: string;
  sizes?: string[];
  isAvailable: boolean;
  isPopular: boolean;
};

async function main() {
  const list: JsonProduct[] = JSON.parse(
    readFileSync("data/products.json", "utf-8"),
  );

  for (const p of list) {
    const data = {
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      price: p.price,
      emoji: p.emoji ?? "",
      image: p.image ?? null,
      sizes: p.sizes?.length ? p.sizes.join(",") : null,
      isAvailable: p.isAvailable,
      isPopular: p.isPopular,
    };
    await prisma.product.upsert({
      where: { id: p.id },
      update: data,
      create: { id: p.id, ...data },
    });
  }

  const promos = [
    {
      code: "WELCOME10",
      kind: "percent",
      value: 10,
      minSubtotal: 0,
      firstOrderOnly: true,
    },
    {
      code: "FRIDAY500",
      kind: "fixed",
      value: 500,
      minSubtotal: 6000,
      firstOrderOnly: false,
    },
  ];
  for (const p of promos) {
    await prisma.promo.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  console.log(`Готово, блюд в базе: ${list.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
