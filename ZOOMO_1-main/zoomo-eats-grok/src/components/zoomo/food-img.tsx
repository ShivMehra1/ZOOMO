import { useEffect, useState } from "react";
import { IMG } from "@/lib/zoomo-data";

export function FoodImg({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const fallback = IMG.dishFallback;
  const [url, setUrl] = useState((src && src.trim()) || fallback);
  useEffect(() => {
    setUrl((src && src.trim()) || fallback);
  }, [src, fallback]);
  if (!url) return <div className={className} aria-hidden />;
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (url !== IMG.dishFallback) setUrl(IMG.dishFallback);
      }}
    />
  );
}
