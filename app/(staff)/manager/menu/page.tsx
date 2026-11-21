import AccessDenied from "@/components/AccessDenied";
import { categories } from "@/lib/data";
import { getProducts } from "@/lib/products-db";
import { getSession } from "@/lib/demo-session";
import { formatPrice } from "@/lib/labels";
import { canAccess, routeRoles } from "@/lib/permissions";
import { createProduct, deleteProduct } from "./actions";
import CategoryIcon from "@/components/CategoryIcon";
import ListFilters from "@/components/ListFilters";
import AddProductModal from "@/components/AddProductModal";
import SortSelect from "@/components/SortSelect";
import Link from "next/link";
import DeleteProductModal from "@/components/DeleteProductModal";
import ProductEditModal from "@/components/ProductEditModal";

type SearchParams = Promise<{ sort?: string }>;

export default async function ManagerMenuPage({ searchParams }: { searchParams: SearchParams }) {
    const { sort } = await searchParams;
  const { role } = await getSession();

  if (!canAccess(role, "/manager/menu")) {
    return <AccessDenied allowed={routeRoles["/manager/menu"]} />;
  }
    const products = (await getProducts()).sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "hidden") return Number(a.isAvailable) - Number(b.isAvailable);
        return a.name.localeCompare(b.name, "ru");
    });
  return (
    <>
        <div className="page-head row-between">
            <div>
                <h1>Меню</h1>
                <p className="muted">Всего позиций: {products.length}</p>
            </div>
            <AddProductModal categories={categories} count={products.length} />
        </div>

        <SortSelect
            options={[
                { value: "name", label: "По названию" },
                { value: "price-asc", label: "Сначала дешёвые" },
                { value: "price-desc", label: "Сначала дорогие" },
                { value: "hidden", label: "Сначала скрытые" },
            ]}
        />
      <ListFilters options={categories.map((c) => ({ value: c.id, label: c.name }))}>
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
              <tr key={p.id} data-filter-item data-filter={p.categoryId}>
                  <td>
                      <Link href={`/manager/menu/${p.id}`} className="icon-row dish-link">
                          <CategoryIcon name={categories.find((c) => c.id === p.categoryId)?.name ?? ""} />
                          <strong>{p.name}</strong>
                      </Link>
                  </td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  {p.isAvailable ? "В наличии" : <span className="muted">Нет в наличии</span>}
                </td>
                  <td className="right">
                      <div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          <ProductEditModal product={p} categories={categories} />
                          <DeleteProductModal id={p.id} name={p.name} action={deleteProduct} />
                      </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </ListFilters>
    </>
  );
}
