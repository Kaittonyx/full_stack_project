import type { Metadata } from "next";
import PizzaBuilder from "@/components/PizzaBuilder";
import { ingredients } from "@/lib/data";
import "./builder.css";

export const metadata: Metadata = {
  title: "Конструктор пиццы — LINK Pizza",
};

export default function BuilderPage() {
  return (
    <div className="container section">
      <div className="page-head">
        <h1>Конструктор пиццы</h1>
        <p className="muted">
          Выберите тесто и соус слева, затем перетащите ингредиенты справа на пиццу или просто нажимайте на них.
        </p>
      </div>
      <PizzaBuilder ingredients={ingredients} />
    </div>
  );
}
