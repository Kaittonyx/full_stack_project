import AccessDenied from "@/components/AccessDenied";
import { categories } from "@/lib/data";
import { getProducts } from "@/lib/products-db";
import { getSession } from "@/lib/demo-session";
import { formatPrice } from "@/lib/labels";
import { canAccess, routeRoles } from "@/lib/permissions";
import { createProduct, deleteProduct } from "./actions";
import CategoryIcon from "@/components/CategoryIcon";

export default async function ManagerMenuPage() {
  const { role } = await getSession();

  if (!canAccess(role, "/manager/menu")) {
    return <AccessDenied allowed={routeRoles["/manager/menu"]} />;
  }
  const products = await getProducts();
  return (
    <>
      <div className="page-head">
        <h1>Меню</h1>
        <p className="muted">Всего позиций: {products.length}</p>
      </div>
      <form action={createProduct} className="add-form">
  <h2>Добавить блюдо</h2>
  <input name="name" placeholder="Название, например Барбекю" required />
  <input name="description" placeholder="Описание: Курица, лук, соус барбекю" />
  <input name="price" type="number" placeholder="Цена" required />
<input name="image" placeholder="Путь к картинке: /images/pizzas/пицца.png" />
  <input name="sizes" placeholder="Размеры: 25 см, 30 см, 35 см" />
  <select name="categoryId">
    {categories.map((c) => (
<option key={c.id} value={c.id}>
  {c.name}
</option>
    ))}
  </select>
  <button type="submit" className="btn btn-primary">
    Добавить
  </button>
</form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Блюдо</th>
              <th>Цена</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
 <td>
  <span className="icon-row">
    <CategoryIcon name={categories.find((c) => c.id === p.categoryId)?.name ?? ""} />
    <strong>{p.name}</strong>
  </span>
</td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  {p.isAvailable ? "В наличии" : <span className="muted">Нет в наличии</span>}
                </td>
                <td className="right">
            <form action={deleteProduct}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="btn btn-ghost btn-sm">
                    Удалить
                    </button>
                </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}