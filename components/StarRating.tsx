import { Star } from "lucide-react";

export default function StarRating({ value, size = 16 }: { value: number; size?: number }) {
    return (
        <span className="stars" role="img" aria-label={`Оценка ${value.toFixed(1)} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} fill={n <= Math.round(value) ? "currentColor" : "none"} />
      ))}
    </span>
    );
}