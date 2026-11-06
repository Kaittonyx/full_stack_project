"use client";

import { useState } from "react";

// Фото товара. Если файла нет или он не загрузился, показываем эмодзи.
export default function ProductImage({
  src,
  emoji,
  alt,
}: {
  src?: string;
  emoji: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="product-emoji" aria-hidden="true">
        {emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="product-img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      ref={(el) => {
        // Если картинка не загрузилась ещё до подключения React, onError уже не сработает
        if (el && el.complete && el.naturalWidth === 0) setFailed(true);
      }}
    />
  );
}