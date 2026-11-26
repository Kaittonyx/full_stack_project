"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function StarInput({ name }: { name: string }) {
    const [value, setValue] = useState(0);
    const [hover, setHover] = useState(0);
    const shown = hover || value;

    return (
        <div className="star-input" onMouseLeave={() => setHover(0)}>
            <input type="hidden" name={name} value={value} />
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    className={n <= shown ? "star on" : "star"}
                    aria-label={`${n} из 5`}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setValue(n)}
                >
                    <Star size={26} fill={n <= shown ? "currentColor" : "none"} />
                </button>
            ))}
        </div>
    );
}