"use client";

import { useMemo, useRef, useState, useTransition, type DragEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { addCustomPizza } from "@/lib/cart-actions";
import {
  MAX_PER_INGREDIENT,
  MAX_TOTAL_PIECES,
  PORTION_SIZE,
  calcPrice,
  doughs,
  scoreRecipe,
  sizes,
  type PizzaRecipe,
} from "@/lib/builder";
import { formatPrice } from "@/lib/labels";
import type { Ingredient } from "@/lib/types";

interface Piece {
  uid: number;
  ingredientId: string;
  x: number; // % от ширины пиццы
  y: number; // % от высоты пиццы
  rot: number;
}

const SAUCE_COLORS: Record<string, string> = {
  "i-tomato-sauce": "#d23a22",
  "i-cream-sauce": "#fbf0d9",
};
const DEFAULT_SAUCE = "#e0643f";

const CHEESE_BG: Record<string, string> = {
  "i-mozzarella":
    "radial-gradient(circle at 28% 30%, rgba(255,248,214,.95) 0 11%, transparent 12%), radial-gradient(circle at 68% 62%, rgba(255,244,200,.9) 0 14%, transparent 15%), radial-gradient(circle at 40% 76%, rgba(255,248,214,.9) 0 9%, transparent 10%), rgba(255,228,140,.78)",
  "i-cheddar": "rgba(247,166,56,.55)",
};
const DEFAULT_CHEESE = "rgba(255,228,140,.7)";

const FIELD_RADIUS = 38; // в каких пределах (в % от пиццы) можно раскладывать начинку

// Выбираем из нескольких случайных точек ту, что дальше всего от уже лежащих кусочков:
// так начинка ложится равномерно, а не кучками.
function pickSpot(existing: Piece[]): { x: number; y: number } {
  let best = { x: 50, y: 50 };
  let bestDist = -1;
  for (let i = 0; i < 14; i++) {
    const r = FIELD_RADIUS * Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    const c = { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
    const d = existing.reduce((min, p) => Math.min(min, Math.hypot(p.x - c.x, p.y - c.y)), Infinity);
    if (d > bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

function PieceFace({ ingredient }: { ingredient: Ingredient }) {
  // Пепперони рисуем кружком: эмодзи 🍖 на пицце выглядит странно
  if (ingredient.id === "i-pepperoni") return <span className="pb-pepperoni" aria-hidden="true" />;
  return <span aria-hidden="true">{ingredient.emoji}</span>;
}

export default function PizzaBuilder({ ingredients }: { ingredients: Ingredient[] }) {
  const sauces = ingredients.filter((i) => i.type === "sauce");
  const cheeses = ingredients.filter((i) => i.type === "cheese");
  const meats = ingredients.filter((i) => i.type === "meat");
  const veggies = ingredients.filter((i) => i.type === "vegetable");
  const toppingIds = new Set([...meats, ...veggies].map((i) => i.id));
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  const [doughId, setDoughId] = useState("classic");
  const [size, setSize] = useState(30);
  const [sauceId, setSauceId] = useState<string | null>(sauces[0]?.id ?? null);
  const [cheeseIds, setCheeseIds] = useState<string[]>(cheeses[0] ? [cheeses[0].id] : []);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [dragging, setDragging] = useState(false);
  const [readyPrice, setReadyPrice] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const pizzaRef = useRef<HTMLDivElement>(null);
  const nextUid = useRef(1);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of pieces) m[p.ingredientId] = (m[p.ingredientId] ?? 0) + 1;
    return m;
  }, [pieces]);

  const recipe: PizzaRecipe = useMemo(
    () => ({
      doughId,
      size,
      sauceId,
      cheeseIds,
      toppings: Object.entries(counts).map(([ingredientId, count]) => ({ ingredientId, count })),
    }),
    [doughId, size, sauceId, cheeseIds, counts],
  );

  const price = calcPrice(recipe, ingredients);
  const score = scoreRecipe(recipe);
  const dough = doughs.find((d) => d.id === doughId);
  const sauce = sauceId ? byId.get(sauceId) : undefined;

  const summary = [
    dough?.name,
    `${size} см`,
    sauce?.name,
    ...cheeseIds.map((id) => byId.get(id)?.name),
    ...recipe.toppings.map((t) => `${byId.get(t.ingredientId)?.name} ×${t.count}`),
  ].filter(Boolean);

  function isFull(id: string) {
    return (counts[id] ?? 0) >= MAX_PER_INGREDIENT || pieces.length >= MAX_TOTAL_PIECES;
  }

  function addPiece(id: string, at?: { x: number; y: number }) {
    const ingredient = byId.get(id);
    if (!ingredient || !ingredient.isAvailable || isFull(id)) return;
    const spot = at ?? pickSpot(pieces);
    setPieces([...pieces, { uid: nextUid.current++, ingredientId: id, ...spot, rot: Math.round(Math.random() * 360) }]);
    setReadyPrice(null);
  }

  function removePiece(uid: number) {
    setPieces(pieces.filter((p) => p.uid !== uid));
    setReadyPrice(null);
  }

  function removeOne(id: string) {
    const last = [...pieces].reverse().find((p) => p.ingredientId === id);
    if (last) removePiece(last.uid);
  }

  function toggleCheese(id: string) {
    setCheeseIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    setReadyPrice(null);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const id = e.dataTransfer.getData("text/plain");
    const el = pizzaRef.current;
    if (!el || !toppingIds.has(id)) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (Math.hypot(x - 50, y - 50) > FIELD_RADIUS + 2) return; // бросили мимо пиццы
    addPiece(id, { x, y });
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      addPiece(id);
    }
  }

  function renderTopping(i: Ingredient) {
    const count = counts[i.id] ?? 0;
    const disabled = !i.isAvailable || isFull(i.id);
    return (
      <div key={i.id} className={`pb-ing ${count > 0 ? "pb-ing-on" : ""}`}>
        <div
          className="pb-ing-main"
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          draggable={!disabled}
          onClick={() => addPiece(i.id)}
          onKeyDown={(e) => handleKey(e, i.id)}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", i.id);
            e.dataTransfer.effectAllowed = "copy";
            setDragging(true);
          }}
          onDragEnd={() => setDragging(false)}
        >
          <span className="pb-ing-icon">
            <PieceFace ingredient={i} />
          </span>
          <span className="pb-ing-text">
            <strong>{i.name}</strong>
            <small>{i.isAvailable ? `${formatPrice(i.price)} за порцию` : "Нет в наличии"}</small>
          </span>
        </div>
        {count > 0 && (
          <div className="pb-ing-count">
            <button type="button" aria-label={`Убрать: ${i.name}`} onClick={() => removeOne(i.id)}>
              −
            </button>
            <span>{count}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-layout">
      {/* ===== Слева: тесто, размер, соус ===== */}
      <aside className="card pb-panel">
        <h3>Тесто</h3>
        <div className="pb-options">
          {doughs.map((d) => (
            <button
              key={d.id}
              type="button"
              className="pb-option"
              aria-pressed={doughId === d.id}
              onClick={() => {
                setDoughId(d.id);
                setReadyPrice(null);
              }}
            >
              <strong>{d.name}</strong>
              <small>
                {d.hint}
                {d.extra > 0 ? ` · +${formatPrice(d.extra)}` : ""}
              </small>
            </button>
          ))}
        </div>

        <h3>Размер</h3>
        <div className="pb-sizes">
          {sizes.map((s) => (
            <button
              key={s.value}
              type="button"
              className="pb-option"
              aria-pressed={size === s.value}
              onClick={() => {
                setSize(s.value);
                setReadyPrice(null);
              }}
            >
              <strong>{s.value} см</strong>
              <small>{formatPrice(s.price)}</small>
            </button>
          ))}
        </div>

        <h3>Соус</h3>
        <div className="pb-options">
          <button
            type="button"
            className="pb-option"
            aria-pressed={sauceId === null}
            onClick={() => {
              setSauceId(null);
              setReadyPrice(null);
            }}
          >
            <strong>Без соуса</strong>
            <small>Бесплатно</small>
          </button>
          {sauces.map((s) => (
            <button
              key={s.id}
              type="button"
              className="pb-option"
              aria-pressed={sauceId === s.id}
              disabled={!s.isAvailable}
              onClick={() => {
                setSauceId(s.id);
                setReadyPrice(null);
              }}
            >
              <strong>
                {s.emoji} {s.name}
              </strong>
              <small>{!s.isAvailable ? "Нет в наличии" : s.price > 0 ? `+${formatPrice(s.price)}` : "Бесплатно"}</small>
            </button>
          ))}
        </div>
      </aside>

      {/* ===== Посередине: пицца ===== */}
      <section className="pb-center" aria-label="Ваша пицца">
        <div
          className={`pb-board ${dragging ? "pb-board-active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={handleDrop}
        >
          <div ref={pizzaRef} className="pb-pizza" data-dough={doughId} style={{ width: `${(size / 35) * 92}%` }}>
            <div className="pb-crust" />
            <div className="pb-base" />
            {sauce && <div className="pb-sauce" style={{ background: SAUCE_COLORS[sauce.id] ?? DEFAULT_SAUCE }} />}
            {cheeseIds.map((id) => (
              <div key={id} className="pb-cheese" style={{ background: CHEESE_BG[id] ?? DEFAULT_CHEESE }} />
            ))}
            <div className="pb-pieces">
              {pieces.map((p) => {
                const ingredient = byId.get(p.ingredientId);
                if (!ingredient) return null;
                return (
                  <button
                    key={p.uid}
                    type="button"
                    className="pb-piece"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) rotate(${p.rot}deg)` }}
                    aria-label={`Убрать: ${ingredient.name}`}
                    title="Нажмите, чтобы убрать"
                    onClick={() => removePiece(p.uid)}
                  >
                    <PieceFace ingredient={ingredient} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card pb-summary">
          <div className="row-between">
            <div>
              <div className="pb-stars" role="img" aria-label={`Оценка: ${score.stars} из 5`}>
                {"★".repeat(score.stars)}
                <span>{"★".repeat(5 - score.stars)}</span>
              </div>
              <strong>{score.title}</strong> <span className="muted small">· {score.points} баллов</span>
            </div>
            <div className="price pb-price">{formatPrice(price)}</div>
          </div>

          <p className="small muted">{summary.join(" · ")}</p>

          {score.notes.length > 0 && (
            <ul className="pb-notes small">
              {score.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}

          <div className="row">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pieces.length === 0}
              onClick={() => {
                setPieces([]);
                setReadyPrice(null);
              }}
            >
              Очистить начинку
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending || (cheeseIds.length === 0 && !sauceId && pieces.length === 0)}
              onClick={() =>
                startTransition(async () => {
                  const res = await addCustomPizza(recipe);
                  setFailed(!res.ok);
                  setReadyPrice(res.ok ? (res.price ?? price) : null);
                })
              }
            >
              В корзину · {formatPrice(price)}
            </button>
          </div>

          {readyPrice !== null && (
            <p className="notice">
              Пицца на {formatPrice(readyPrice)} добавлена в корзину.{" "}
              <Link href="/cart" style={{ fontWeight: 700 }}>
                Перейти в корзину
              </Link>
            </p>
          )}
          {failed && <p className="notice">Не удалось добавить пиццу: проверьте состав.</p>}
        </div>
      </section>

      {/* ===== Справа: ингредиенты ===== */}
      <aside className="card pb-panel">
        <p className="small muted">
          Перетащите ингредиент на пиццу или нажмите на него. Порция — {PORTION_SIZE} кусочков. Нажмите на кусочек
          на пицце, чтобы убрать его.
        </p>

        <h3>Сыр</h3>
        <div className="pb-ing-list">
          {cheeses.map((c) => (
            <button
              key={c.id}
              type="button"
              className="pb-option pb-option-row"
              aria-pressed={cheeseIds.includes(c.id)}
              disabled={!c.isAvailable}
              onClick={() => toggleCheese(c.id)}
            >
              <span className="pb-ing-icon">{c.emoji}</span>
              <span className="pb-ing-text">
                <strong>{c.name}</strong>
                <small>{c.isAvailable ? formatPrice(c.price) : "Нет в наличии"}</small>
              </span>
            </button>
          ))}
        </div>

        <h3>Мясо</h3>
        <div className="pb-ing-list">{meats.map(renderTopping)}</div>

        <h3>Овощи</h3>
        <div className="pb-ing-list">{veggies.map(renderTopping)}</div>
      </aside>
    </div>
  );
}
