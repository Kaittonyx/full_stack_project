import Link from "next/link";
import {

    Pizza,
    Phone,
    Mail,
    Clock,
    MapPin,

} from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
            <div>
              <h4 className="footer-logo">
                <Pizza size={22} />
                LINK Pizza Delivery
              </h4>
              <p className="small">Учебный командный проект. Горячая пицца с доставкой по Астане.
              </p>
            </div>
        <div>

          <h4>Меню</h4>
          <p className="small">
            <Link href="/catalog">Каталог</Link>
            <br />
            <Link href="/builder">Конструктор пиццы</Link>
          </p>
        </div>
        <div>
          <h4>Контакты</h4>
          <div className="footer-concat">
            <Phone size={16} />
            <span> +7 (700) 000-00-00</span>
          </div>
            <div className="footer-concat">
              <Mail size={16} />
              <span> hello@linkpizza.example</span>
            </div>
          <div className="footer-concat">
            <Clock size={16} />
            <span> Ежедневно с 10:00 до 23:00</span>
          </div>
          <div className="footer-concat">
            <MapPin size={16} />
            <span> Астана, Казахстан</span>
          </div>

        </div>
      </div>
    </footer>
  );
}
