import ModalButton from "@/components/ModalButton";
import { createProduct } from "@/app/(staff)/manager/menu/actions";
import type { Category } from "@/lib/types";

export default function AddProductModal({
                                            categories,
                                            count,
                                        }: {
    categories: Category[];
    count: number;
}) {
    return (
        <ModalButton
            label="Добавить блюдо"
            title="Новое блюдо"
            className="btn btn-primary btn-sm"
            resetKey={String(count)}
        >
            <form action={createProduct} className="dialog-form">
                <label>
                    Название
                    <input className="input" name="name" placeholder="Например, Барбекю" required />
                </label>

                <label>
                    Описание
                    <input className="input" name="description" placeholder="Курица, лук, соус барбекю" />
                </label>

                <label>
                    Цена
                    <input className="input" name="price" type="number" required />
                </label>

                <label>
                    Путь к картинке
                    <input className="input" name="image" placeholder="/images/pizzas/bbq.png" />
                </label>

                <label>
                    Размеры через запятую
                    <input className="input" name="sizes" placeholder="25 см, 30 см, 35 см" />
                </label>

                <label>
                    Категория
                    <select className="select" name="categoryId">
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>

                <button type="submit" className="btn btn-primary">
                    Добавить
                </button>
            </form>
        </ModalButton>
    );
}