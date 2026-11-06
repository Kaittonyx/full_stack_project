import { formatPrice } from "@/lib/labels";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }: { product: Product }) {
  const hasSizes = Boolean(product.sizes?.length);

  return (
    <article className="card product-card">
      <div className="product-pic">
        <ProductImage src={product.image} emoji={product.emoji} alt={product.name} />
      </div>
      <div className="product-body">
        <div className="row-between">
          <h3>{product.name}</h3>
          {!product.isAvailable && <span className="badge badge-gray">Нет в наличии</span>}
        </div>
        <p className="muted small">{product.description}</p>
        {hasSizes && <p className="small muted">Размеры: {product.sizes?.join(" · ")}</p>}
        <div className="product-foot">
          <span className="price">
            {hasSizes ? "от " : ""}
            {formatPrice(product.price)}
          </span>
          <button type="button" className="btn btn-primary btn-sm" disabled={!product.isAvailable}>
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
}
