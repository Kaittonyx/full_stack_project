"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/demo-session";
import { getOrders } from "@/lib/orders";
import { addReviews, hasReviewForOrder } from "@/lib/reviews";

const validStars = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;

export async function submitReview(formData: FormData) {
    const { role, user } = await getSession();
    if (role !== "customer" || !user) return;

    const orderId = String(formData.get("orderId") ?? "");
    const order = getOrders().find((o) => o.id === orderId);

    if (!order || order.customerId !== user.id) return;
    if (order.status !== "DELIVERED") return;
    if (hasReviewForOrder(orderId)) return;

    const comment = String(formData.get("comment") ?? "").trim().slice(0, 500);
    const names = [...new Set(order.items.map((i) => i.name))];

    const dishItems = names.flatMap((name, idx) => {
        const rating = Number(formData.get(`rating-${idx}`));
        if (!validStars(rating)) return [];
        return [{ orderId, customerId: user.id, kind: "dish" as const, dish: name, rating, comment }];
    });

    const deliveryRating = Number(formData.get("delivery"));
    const deliveryItems = validStars(deliveryRating)
        ? [
            {
                orderId,
                customerId: user.id,
                kind: "delivery" as const,
                dish: "",
                courierId: order.courierId,
                rating: deliveryRating,
                comment,
            },
        ]
        : [];

    const items = [...dishItems, ...deliveryItems];
    if (items.length === 0) return;

    addReviews(items);
    revalidatePath("/", "layout");
}