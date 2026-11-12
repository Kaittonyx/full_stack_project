"use client";

const ALWAYS_ON = false;

const FLAKES = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: (i * 37) % 100,
    size: 6 + ((i * 7) % 9),
    duration: 8 + ((i * 5) % 11),
    delay: -((i * 3) % 15),
}));

export default function Snow() {
    const month = new Date().getMonth();
    const isSeason = month === 10 || month === 11 || month === 0;

    if (!ALWAYS_ON && !isSeason) return null;

    return (
        <div className="snow" aria-hidden="true" suppressHydrationWarning>
            {FLAKES.map((f) => (
                <span
                    key={f.id}
                    className="snowflake"
                    style={{
                        left: `${f.left}%`,
                        width: f.size,
                        height: f.size,
                        animationDuration: `${f.duration}s`,
                        animationDelay: `${f.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}