import { prisma } from "../lib/prisma";

async function main() {
    const count = await prisma.product.count();
    const first = await prisma.product.findFirst();
    console.log("Блюд в базе:", count);
    console.log("Первое блюдо:", first?.name);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());