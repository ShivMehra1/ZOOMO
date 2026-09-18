import { useNavigate } from "@tanstack/react-router";
import { Clock, Heart, Star, Tag } from "lucide-react";
import { FoodImg } from "./food-img";
import { etaMinOf, gateBy, type Restaurant } from "@/lib/zoomo-data";
import { isRegular, useZoomo } from "@/lib/zoomo-store";

export function RestaurantCard({ r, onOpen }: { r: Restaurant; onOpen: () => void; urgency?: string | null; reason?: string | null }) {
  const nav = useNavigate();
  const { favorites, toggleFavorite, user, visits } = useZoomo();
  const loved = favorites.includes(r.id);
  const regular = isRegular(visits, r.id);

  return (
    <div className="group overflow-hidden rounded-[24px] bg-surface text-left shadow-card transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative h-44 overflow-hidden sm:h-48">
          <FoodImg
            src={r.imageUrl}
            alt={r.name}
            className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
          {r.coupon && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-primary/92 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
              <Tag className="size-3" /> {r.coupon}
            </div>
          )}
          {etaMinOf(r) <= 20 && (
            <div className={`absolute top-3 rounded-full bg-accent px-2 py-1 text-[10px] font-bold tracking-wide text-white uppercase ${r.busy ? "left-16" : "left-3"}`}>
              Zoom 15
            </div>
          )}
          <div className={`absolute top-3 flex items-center gap-1 rounded-full bg-surface/95 px-2 py-1 text-[11px] font-bold text-ink tabular ${etaMinOf(r) <= 20 ? "right-12" : "left-3"}`}>
            <Star className="size-3 fill-primary text-primary" /> {r.rating.toFixed(1)}
          </div>
          {regular && (
            <div className="absolute top-3 right-12 rounded-full bg-white px-2 py-1 text-[10px] font-bold tracking-wide text-primary uppercase">
              Regular
            </div>
          )}
        </div>
      </button>
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5 pb-4">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
            {r.cuisineType} · {r.area}
          </p>
          <h3 className="mb-2 truncate text-[17px] font-bold tracking-tight text-ink">{r.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {r.eta}
            </span>
            <span>·</span>
            <span className="font-bold text-primary">By {gateBy(etaMinOf(r))}</span>
            <span>·</span>
            <span className="tabular">₹{r.costForTwo} for two</span>
          </div>
        </button>
        <button
          aria-label={loved ? "Remove favourite" : "Save restaurant"}
          onClick={(e) => {
            e.stopPropagation();
            if (!user) {
              nav({ to: "/login" });
              return;
            }
            toggleFavorite(r.id);
          }}
          className={`mt-1 flex size-9 shrink-0 items-center justify-center rounded-full ${
            loved ? "bg-sage text-primary" : "bg-page text-muted"
          }`}
        >
          <Heart className={`size-4 ${loved ? "fill-primary" : ""}`} />
        </button>
      </div>
    </div>
  );
}
