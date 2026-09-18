import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackBar({
  title,
  to = "/",
}: {
  title: string;
  to?: "/" | "/restaurants" | "/cart" | "/orders" | "/profile" | "/search";
}) {
  const nav = useNavigate();
  return (
    <div className="mb-6 flex items-center gap-3">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          nav({ to, replace: true });
        }}
        className="relative z-20 flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink"
        aria-label="Back"
      >
        <ArrowLeft className="size-4" />
      </button>
      <h1 className="display min-w-0 flex-1 truncate text-[22px] text-ink">{title}</h1>
    </div>
  );
}
