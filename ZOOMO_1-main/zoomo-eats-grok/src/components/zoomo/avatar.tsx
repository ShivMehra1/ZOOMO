import { publicMedia } from "@/lib/api-base";

export function Avatar({
  url,
  name,
  className = "size-10 text-sm",
}: {
  url?: string | null;
  name?: string;
  className?: string;
}) {
  const src = url && !url.startsWith("blob:") ? publicMedia(url) : url || "";
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage font-bold text-primary ${className}`}>
      {src ? <img src={src} alt="" className="size-full object-cover" /> : (name || "?")[0]?.toUpperCase()}
    </div>
  );
}
