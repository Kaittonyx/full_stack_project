import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/types";

type Row = Awaited<ReturnType<typeof prisma.product.findMany>>[number];

function toProduct(row: Row): Product {
    return {
        id: row.id,
        categoryId: row.categoryId,
        name: row.name,
        description: row.description,
        price: row.price,
        emoji: row.emoji,
        image: row.image ?? undefined,
        ingredients: [],
        sizes: row.sizes ? row.sizes.split(",").map((s) => s.trim()) : undefined,
        isAvailable: row.isAvailable,
        isPopular: row.isPopular,
    };
}

export async function getProducts(): Promise<Product[]> {
    const rows = await prisma.product.findMany();
    return rows.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
    const row = await prisma.product.findUnique({ where: { id } });
    return row ? toProduct(row) : undefined;
}

export async function createProductInDb(product: Product): Promise<void> {
    await prisma.product.create({
        data: {
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            description: product.description,
            price: product.price,
            emoji: product.emoji,
            image: product.image ?? null,
            sizes: product.sizes?.length ? product.sizes.join(",") : null,
            isAvailable: product.isAvailable,
            isPopular: product.isPopular,
        },
    });
}

export async function deleteProductFromDb(id: string): Promise<void> {
    await prisma.product.deleteMany({ where: { id } });
}