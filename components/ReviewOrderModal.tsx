import ModalButton from "@/components/ModalButton";
import StarInput from "@/components/StarInput";
import { submitReview } from "@/lib/review-actions";
import type { Order } from "@/lib/types";

export default function ReviewOrderModal({ order }: { order: Order }) {
    const names = [...new Set(order.items.map((i) => i.name))];

    return (
        <ModalButton label="Оценить" title={`Оцените заказ ${order.number}`} className="btn btn-primary btn-sm">
            <form action={submitReview} className="dialog-form">
                <input type="hidden" name="orderId" value={order.id} />

                <h3>Блюда</h3>
                {names.map((name, idx) => (
                    <div key={name} className="review-row">
                        <strong>{name}</strong>
                        <StarInput name={`rating-${idx}`} />
                    </div>
                ))}

                <h3>Доставка</h3>
                <div className="review-row">
                    <span>Курьер и скорость</span>
                    <StarInput name="delivery" />
                </div>

                <label>
                    Комментарий (необязательно)
                    <textarea className="input" name="comment" rows={3} maxLength={500} />
                </label>

                <button type="submit" className="btn btn-primary">
                    Отправить отзыв
                </button>
            </form>
        </ModalButton>
    );
}