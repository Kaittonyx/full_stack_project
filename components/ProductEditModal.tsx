import ModalButton from "@/components/ModalButton";
import { updateProduct } from "@/app/(staff)/manager/menu/actions";
import type { Category, Product } from "@/lib/types";

export default function ProductEditModal({
                                             product,
                                             categories,
                                         }: {
    product: Product;
    categories: Category[];
}) {
    return (
        <ModalButton
            label="Изменить"
            title={`Изменить: ${product.name}`}
            resetKey={JSON.stringify(product)}
        >
            <form action={updateProduct} className="dialog-form">
                <input type="hidden" name="id" value={product.id} />
                <input type="hidden" name="emoji" value={product.emoji} />

                <label>
                    Название
                    <input className="input" name="name" defaultValue={product.name} required />
                </label>

                <label>
                    Описание
                    <input className="input" name="description" defaultValue={product.description} />
                </label>

                <label>
                    Цена
                    <input className="input" name="price" type="number" defaultValue={product.price} required />
                </label>

                <label>
                    Путь к картинке
                    <input className="input" name="image" defaultValue={product.image ?? ""} />
                </label>

                <label>
                    Размеры через запятую
                    <input className="input" name="sizes" defaultValue={product.sizes?.join(", ") ?? ""} />
                </label>

                <label>
                    Категория
                    <select className="select" name="categoryId" defaultValue={product.categoryId}>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="check">
                    <input type="checkbox" name="isAvailable" defaultChecked={product.isAvailable} />
                    В наличии
                </label>

                <label className="check">
                    <input type="checkbox" name="isPopular" defaultChecked={product.isPopular} />
                    Показывать в «Популярном»
                </label>

                <button type="submit" className="btn btn-primary">
                    Сохранить
                </button>
            </form>
        </ModalButton>
    );
}