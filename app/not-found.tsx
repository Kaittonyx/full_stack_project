import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container section">
      <div className="card lock">
        <SearchX size={56} className="lock-icon" />
        <h2>Страница не найдена</h2>
        <p className="muted">Возможно, её удалили или в адресе опечатка.</p>
        <Link href="/" className="btn btn-primary">
          На главную
        </Link>
      </div>
    </div>
  );
}