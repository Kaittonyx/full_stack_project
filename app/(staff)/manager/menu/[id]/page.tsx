import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AccessDenied from "@/components/AccessDenied";
import CategoryIcon from "@/components/CategoryIcon";
import DeleteProductModal from "@/components/DeleteProductModal";
import ProductEditModal from "@/components/ProductEditModal";
import { categories } from "@/lib/data";
import { getSession } from "@/lib/demo-session";
import { formatDate, formatPrice, formatTime } from "@/lib/labels";
import { getOrders } from "@/lib/orders";
import { canAccess, routeRoles } from "@/lib/permissions";
import { getProductById } from "@/lib/products-db";
import { deleteProductAndGoBack } from "../actions";

type Params = Promise<{ id: string }>;

export default async function ProductDetailsPage({ params }: { params: Params }) {
    const { role } = await getSession();

    if (!canAccess(role, "/manager/menu")) {
        return <AccessDenied allowed={routeRoles["/manager/menu"]} />;
    }

    const { id } = await params;
    const product = await getProductById(id);
    if (!product) notFound();

    const category = categories.find((c) => c.id === product.categoryId);

    const sales = getOrders()
        .filter((o) => o.status !== "CANCELLED")
        .flatMap((o) =>
            o.items.filter((i) => i.name === product.name).map((i) => ({ order: o, item: i })),
        );
    const soldCount = sales.reduce((sum, s) => sum + s.item.quantity, 0);
    const revenue = sales.reduce((sum, s) => sum + s.item.quantity * s.item.unitPrice, 0);
    const ordersCount = new Set(sales.map((s) => s.order.id)).size;
    const recent = sales.slice(0, 5);

    return (
        <>
            <Link href="/manager/menu" className="back-link">
                <ArrowLeft size={16} />
                К списку меню
            </Link>

            <div className="page-head row-between">
                <div>
                    <h1>{product.name}</h1>
                    <p className="muted">{category?.name ?? "Без категории"}</p>
                </div>
                <div className="row">
                    <ProductEditModal product={product} categories={categories} />
                    <DeleteProductModal id={product.id} name={product.name} action={deleteProductAndGoBack} />
                </div>
            </div>

            <div className="detail-grid">
                <div className="detail-pic">
                    {product.image ? (
                        <img src={product.image} alt={product.name} />
                    ) : (
                        <CategoryIcon name={category?.name ?? ""} size={72} />
                    )}
                </div>

                <div className="card">
                    <h3>О блюде</h3>
                    <div className="detail-facts">
                        <div>
                            <span className="muted">{product.sizes?.length ? "Цена (от)" : "Цена"}</span>
                            <strong>{formatPrice(product.price)}</strong>
                        </div>
                        <div>
                            <span className="muted">Размеры</span>
                            <span>{product.sizes?.join(", ") ?? "Одна порция"}</span>
                        </div>
                        <div>
                            <span className="muted">Наличие</span>
                            <span className={`badge ${product.isAvailable ? "badge-green" : "badge-gray"}`}>
                {product.isAvailable ? "В наличии" : "Нет в наличии"}
              </span>
                        </div>
                        <div>
                            <span className="muted">В «Популярном»</span>
                            <span>{product.isPopular ? "Да" : "Нет"}</span>
                        </div>
                        <div>
                            <span className="muted">Описание</span>
                            <span>{product.description || "—"}</span>
                        </div>
                        <div>
                            <span className="muted">Идентификатор</span>
                            <code>{product.id}</code>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats">
                <div className="card stat">
                    <div className="muted small">Продано</div>
                    <div className="value">{soldCount} шт.</div>
                </div>
                <div className="card stat">
                    <div className="muted small">Выручка</div>
                    <div className="value">{formatPrice(revenue)}</div>
                </div>
                <div className="card stat">
                    <div className="muted small">Заказов с блюдом</div>
                    <div className="value">{ordersCount}</div>
                </div>
            </div>

            <div className="section-head">
                <h2>Последние заказы с этим блюдом</h2>
            </div>
            <div className="table-wrap">
                <table>
                    <thead>
                    <tr>
                        <th>Заказ</th>
                        <th>Дата</th>
                        <th>Позиция</th>
                        <th>Сумма</th>
                    </tr>
                    </thead>
                    <tbody>
                    {recent.length === 0 && (
                        <tr>
                            <td colSpan={4} className="muted">
                                Это блюдо ещё не заказывали
                            </td>
                        </tr>
                    )}
                    {recent.map(({ order, item }) => (
                        <tr key={`${order.id}-${item.name}-${item.size ?? ""}`}>
                            <td>
                                <strong>{order.number}</strong>
                            </td>
                            <td>
                                {formatDate(order.createdAt)}, {formatTime(order.createdAt)}
                            </td>
                            <td>
                                {item.size ? `${item.size}, ` : ""}
                                {item.quantity} шт.
                            </td>
                            <td>{formatPrice(item.quantity * item.unitPrice)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}