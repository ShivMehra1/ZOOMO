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
  const [url, setUrl] = useState(src || IMG.dishFallback);
  useEffect(() => {
    setUrl(src || IMG.dishFallback);
  }, [src]);
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
