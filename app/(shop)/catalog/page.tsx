import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/lib/data";
import { getProducts } from "@/lib/products-db";
import { Search } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";

type SearchParams = Promise<{ category?: string; q?: string }>;

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, q } = await searchParams;
  const products = await getProducts();
  const query = (q ?? "").trim().toLowerCase();
  const activeCategory = categories.find((c) => c.slug === category);

  const visible = products.filter((p) => {
    const inCategory = !activeCategory || p.categoryId === activeCategory.id;
    const matches = !query || p.name.toLowerCase().includes(query);
    return inCategory && matches;
  });

  return (
    <div className="container section">
      <div className="page-head">
        <h1>Меню</h1>
        <p className="muted">Пиццы, напитки, закуски и десерты.</p>
      </div>

      <div className="row-between" style={{ marginBottom: 20 }}>
        <form className="search-form" action="/catalog">
          {activeCategory && <input type="hidden" name="category" value={activeCategory.slug} />}
          <input
            className="input"
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Найти блюдо, например «пепперони»"
            aria-label="Поиск по меню"
          />
          <button type="submit" className="btn btn-primary">
            Найти
          </button>
        </form>
      </div>

      <div className="chips" style={{ marginBottom: 24 }}>
        <Link href="/catalog" className={`chip ${!activeCategory ? "chip-active" : ""}`}>
          Все
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalog?category=${c.slug}`}
            className={`chip ${activeCategory?.id === c.id ? "chip-active" : ""}`}
          >
            <CategoryIcon name={c.name} size={18} />
            {c.name}
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card lock">
          <Search size={56} className="lock-icon" />
          <h3>Ничего не нашли</h3>
          <p className="muted">Попробуйте изменить запрос или выбрать другую категорию.</p>
        </div>
      ) : (
        <div className="grid grid-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
