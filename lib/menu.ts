// Общие для клиента и сервера правила цены каталожных товаров.
// ProductCard показывает цену, а сервер пересчитывает её по тем же правилам — клиенту не доверяем.

export const addons = [
  { name: "Моцарелла", price: 300, image: "/images/addons/mozarela.png" },
  { name: "Чеддер и пармезан", price: 300, image: "/images/addons/cheder parmezan.png" },
  { name: "Халапеньо", price: 100, image: "/images/addons/halapeno.png" },
  { name: "Ветчина", price: 400, image: "/images/addons/ham.png" },
  { name: "Грибы", price: 300, image: "/images/addons/mushroms.png" },
  { name: "Пепперони", price: 400, image: "/images/addons/pepperoni.png" },
];

export const SIZE_STEP_PRICE = 600; // доплата за каждый следующий размер
export const doughNames = ["Традиционное", "Тонкое"];

export const DELIVERY_FEE = 500;
export const FREE_DELIVERY_FROM = 8000;
export const MAX_LINE_QTY = 20;

export const paymentMethods = ["Картой онлайн", "Наличными курьеру"];
