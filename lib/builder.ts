// Логика конструктора пиццы: тесто, размеры, расчёт цены и «игровая» оценка рецепта.
// Функции чистые (без React и браузерных API), поэтому тот же расчёт можно
// использовать в Route Handler: по ТЗ (п. 3.3) итоговая цена должна считаться на сервере.

import type { Ingredient } from "./types";

// 1 порция = 6 кусочков ингредиента. Цена в ingredients.json — за одну порцию.
export const PORTION_SIZE = 6;
export const MAX_PER_INGREDIENT = 18; // не больше 3 порций одного ингредиента
export const MAX_TOTAL_PIECES = 48; // не больше 48 кусочков на всей пицце

export interface DoughOption {
  id: string;
  name: string;
  hint: string;
  extra: number; // доплата к цене, ₸
}

export const doughs: DoughOption[] = [
  { id: "thin", name: "Тонкое тесто", hint: "Хрустящее, как в Италии", extra: 0 },
  { id: "classic", name: "Классическое тесто", hint: "Золотая середина", extra: 0 },
  { id: "fluffy", name: "Пышное тесто", hint: "Мягкое и воздушное", extra: 200 },
  { id: "cheese-crust", name: "Тесто с сырным бортом", hint: "Борт с начинкой из сыра", extra: 500 },
];

export interface SizeOption {
  value: number; // диаметр, см
  price: number; // базовая цена теста нужного размера, ₸
}

export const sizes: SizeOption[] = [
  { value: 25, price: 2400 },
  { value: 30, price: 3000 },
  { value: 35, price: 3700 },
];

export interface PizzaRecipe {
  doughId: string;
  size: number;
  sauceId: string | null;
  cheeseIds: string[];
  toppings: { ingredientId: string; count: number }[]; // count — число кусочков
}

export function calcPrice(recipe: PizzaRecipe, all: Ingredient[]): number {
  const byId = new Map(all.map((i) => [i.id, i]));

  let total = sizes.find((s) => s.value === recipe.size)?.price ?? 0;
  total += doughs.find((d) => d.id === recipe.doughId)?.extra ?? 0;

  if (recipe.sauceId) total += byId.get(recipe.sauceId)?.price ?? 0;
  for (const id of recipe.cheeseIds) total += byId.get(id)?.price ?? 0;
  for (const t of recipe.toppings) {
    const portions = Math.ceil(t.count / PORTION_SIZE);
    total += (byId.get(t.ingredientId)?.price ?? 0) * portions;
  }
  return total;
}

// ===== Игровая оценка рецепта =====

export interface RecipeScore {
  points: number; // 0–100
  stars: number; // 0–5
  title: string;
  notes: string[];
}

const COMBOS: { name: string; ids: string[]; bonus: number }[] = [
  { name: "Классика", ids: ["i-tomato-sauce", "i-mozzarella", "i-pepperoni"], bonus: 12 },
  { name: "Лесная курочка", ids: ["i-chicken", "i-mushrooms"], bonus: 10 },
  { name: "Белая пицца", ids: ["i-cream-sauce", "i-chicken", "i-mushrooms"], bonus: 10 },
  { name: "Ветчина и грибы", ids: ["i-ham", "i-mushrooms"], bonus: 8 },
  { name: "Овощной микс", ids: ["i-olives", "i-pepper", "i-onion"], bonus: 10 },
  { name: "Острая", ids: ["i-pepperoni", "i-pepper"], bonus: 8 },
  { name: "Сырный дуэт", ids: ["i-mozzarella", "i-cheddar"], bonus: 8 },
];

// Баллы за число разных начинок: 0, 1, 2, 3, 4, 5, 6+
const VARIETY_POINTS = [0, 12, 24, 34, 40, 34, 26];

export function scoreRecipe(recipe: PizzaRecipe): RecipeScore {
  const notes: string[] = [];
  let points = 0;

  if (recipe.sauceId) points += 15;
  else notes.push("Без соуса пицца получится суховатой");

  const cheeseCount = recipe.cheeseIds.length;
  if (cheeseCount === 0) notes.push("Добавьте сыр — без него это не пицца");
  else points += cheeseCount === 1 ? 20 : 28;

  const toppings = recipe.toppings.filter((t) => t.count > 0);
  const variety = toppings.length;
  points += VARIETY_POINTS[Math.min(variety, 6)];
  if (variety >= 5) notes.push("Слишком много разных вкусов — они начнут спорить друг с другом");

  const picked = new Set<string>([
    ...(recipe.sauceId ? [recipe.sauceId] : []),
    ...recipe.cheeseIds,
    ...toppings.map((t) => t.ingredientId),
  ]);
  for (const combo of COMBOS) {
    if (combo.ids.every((id) => picked.has(id))) {
      points += combo.bonus;
      notes.push(`Комбо «${combo.name}»: +${combo.bonus}`);
    }
  }

  const pieces = toppings.reduce((sum, t) => sum + t.count, 0);
  if (variety > 0 && pieces < PORTION_SIZE) {
    points -= 5;
    notes.push("Начинки маловато");
  }
  if (pieces > 36) {
    points -= 10;
    notes.push("Начинки слишком много, пицца будет сырой в центре");
  }

  points = Math.max(0, Math.min(100, points));
  const stars = points === 0 ? 0 : Math.min(5, Math.max(1, Math.ceil(points / 20)));
  const title =
    points === 0
      ? "Пустое тесто"
      : points < 30
        ? "Пока скромно"
        : points < 50
          ? "Неплохо"
          : points < 75
            ? "Вкусно!"
            : "Шедевр!";

  return { points, stars, title, notes };
}
