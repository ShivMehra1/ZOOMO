import { useGoBack } from "@/lib/zoomo-nav";
import { ArrowLeft } from "lucide-react";

export function BackBar({
  title,
  to,
}: {
  title: string;
  to?: "/" | "/restaurants" | "/cart" | "/orders" | "/profile";
}) {
  const back = useGoBack(to ?? "/");
  return (
    <div className="mb-6 flex items-center gap-3">
      <button type="button" onClick={back} className="flex size-10 items-center justify-center rounded-full border border-line bg-surface" aria-label="Back">
        <ArrowLeft className="size-4" />
      </button>
      <h1 className="display min-w-0 flex-1 truncate text-[22px] text-ink">{title}</h1>
    </div>
  );
}
