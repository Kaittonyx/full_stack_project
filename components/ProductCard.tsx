"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/labels";
import type { Product } from "@/lib/types";

const addons = [
    { name: "Моцарелла", price: 300, emoji: "🧀" },
    { name: "Чеддер и пармезан", price: 300, emoji: "🧀" },
    { name: "Халапеньо", price: 100, emoji: "🌶️" },
    { name: "Ветчина", price: 400, emoji: "🥓" },
    { name: "Грибы", price: 300, emoji: "🍄" },
    { name: "Пепперони", price: 400, emoji: "🍕" },
];
const nutritionData: Record<
    string,
    { kcal: number; protein: number; fat: number; carbs: number; weights: Record<string, number> }
> = {
    "Маргарита": {
        kcal: 235, protein: 10.2, fat: 7.1, carbs: 32.5,
        weights: { "25 см": 420, "30 см": 600, "35 см": 820 },
    },
    "Пепперони": {
        kcal: 268, protein: 11.4, fat: 11.2, carbs: 30.1,
        weights: { "25 см": 440, "30 см": 630, "35 см": 860 },
    },
    "Четыре сыра": {
        kcal: 281, protein: 13.0, fat: 12.5, carbs: 29.4,
        weights: { "25 см": 450, "30 см": 650, "35 см": 880 },
    },
    "Гавайская": {
        kcal: 241, protein: 10.6, fat: 7.3, carbs: 33.3,
        weights: { "25 см": 460, "30 см": 660, "35 см": 900 },
    },
    "Мясная": {
        kcal: 289, protein: 13.5, fat: 13.8, carbs: 28.6,
        weights: { "25 см": 470, "30 см": 680, "35 см": 920 },
    },
    "Грибная": {
        kcal: 228, protein: 9.4, fat: 8.2, carbs: 29.8,
        weights: { "25 см": 440, "30 см": 640, "35 см": 870 },
    },
};
export default function ProductCard({ product }: { product: Product }) {
  const hasSizes = Boolean(product.sizes?.length);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(product.sizes?.[0]);
  const [dough, setDough] = useState("Традиционное");
  const [removed, setRemoved] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const ingredients = product.description
      .replace(/^.*:\s*/, "")
      .replace(/\.$/, "")
      .split(/,\s*| и /);
    function toggleIngredient(name: string) {
        setRemoved(
            removed.includes(name)
                ? removed.filter((r) => r !== name)
                : [...removed, name]
        );
    }
    function toggleExtra(name: string) {
        setExtras(
            extras.includes(name)
                ? extras.filter((e) => e !== name)
                : [...extras, name]
        );
    }
  const sizeIndex = Math.max(product.sizes?.findIndex((s) => s === size) ?? 0, 0);
  const extrasPrice = addons
      .filter((a) => extras.includes(a.name))
      .reduce((sum, a) => sum + a.price, 0);
  const currentPrice = product.price + sizeIndex * 600 + extrasPrice;
  const info = nutritionData[product.name];
  const weight = info && size ? info.weights[size] ?? 0 : 0;
  const totalKcal = info ? Math.round((info.kcal * weight) / 100) : 0;

    return (
        <>
            <article className="card product-card">
                <div className="product-pic" onClick={() => setOpen(true)}>
                    {product.emoji}
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

            {open && (
                <div className="modal-overlay" onClick={() => setOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setOpen(false)}>
                            ×
                        </button>
                        {hasSizes && info && (
                            <button
                                type="button"
                                className="info-btn"
                                onClick={() => setShowInfo(!showInfo)}
                            >
                                i
                            </button>
                        )}

                        {showInfo && info && (
                            <div className="info-panel">
                                <p className="info-title">Пищевая ценность на 100 г</p>
                                <div className="info-row"><span>Энерг. ценность</span><strong>{info.kcal} ккал</strong></div>
                                <div className="info-row"><span>Белки</span><strong>{info.protein} г</strong></div>
                                <div className="info-row"><span>Жиры</span><strong>{info.fat} г</strong></div>
                                <div className="info-row"><span>Углеводы</span><strong>{info.carbs} г</strong></div>
                                <div className="info-row"><span>Вес</span><strong>{weight} г</strong></div>
                                <div className="info-row"><span>Всего калорий</span><strong>{totalKcal} ккал</strong></div>
                                <p className="info-note">Может содержать аллергены: глютен, молоко и продукты его переработки.</p>
                            </div>
                        )}
                        <div className="modal-pic">
                            <span
                                className="pizza-emoji"
                                style={{ transform: `scale(${0.7 + sizeIndex * 0.15})` }}
                            >
                                {product.emoji}
                            </span>
                        </div>
                        <div className="modal-info">
                            <h2>{product.name}</h2>
                            {hasSizes ? (
                                <p className="ingredients">
                                    {ingredients.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            className={removed.includes(item) ? "ingredient removed" : "ingredient"}
                                            onClick={() => toggleIngredient(item)}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </p>
                            ) : (
                                <p className="muted">{product.description}</p>
                            )}

                            {hasSizes && (
                                <div className="size-switch">
                                    {product.sizes?.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={s === size ? "size-btn active" : "size-btn"}
                                            onClick={() => setSize(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {hasSizes && (
                                <div className="size-switch">
                                    {["Традиционное", "Тонкое"].map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            className={d === dough ? "size-btn active" : "size-btn"}
                                            onClick={() => setDough(d)}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {hasSizes && (
                                <>
                                    <h4 className="extras-title">Добавить по вкусу</h4>
                                    <div className="extras">
                                        {addons.map((a) => (
                                            <button
                                                key={a.name}
                                                type="button"
                                                className={extras.includes(a.name) ? "extra active" : "extra"}
                                                onClick={() => toggleExtra(a.name)}
                                            >
                                                <span className="extra-emoji">{a.emoji}</span>
                                                <span className="extra-name">{a.name}</span>
                                                <span className="extra-price">{formatPrice(a.price)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            <button type="button" className="btn btn-primary modal-buy" disabled={!product.isAvailable}>
                                В корзину за {formatPrice(currentPrice)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}