import { Minus, Plus } from "lucide-react";
import { FoodImg } from "./food-img";
import { inr, restaurantById, type Dish } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export function DishCard({
  dish,
  onOpen,
  onNeedLogin,
  hideRestaurant = false,
}: {
  dish: Dish;
  onOpen: () => void;
  onNeedLogin: () => void;
  hideRestaurant?: boolean;
}) {
  const { cart, addToCart, setQty } = useZoomo();
  const r = restaurantById(dish.restaurantId);
  const sizeId = dish.sizes?.[0]?.id;
  const line = `${dish.id}${sizeId ? `__${sizeId}` : ""}`;
  const qty = cart.find((i) => i.dishId === line || i.dishId === dish.id)?.quantity ?? 0;
  const price = sizeId ? dish.sizes!.find((s) => s.id === sizeId)!.price : dish.price;

  function add() {
    const res = addToCart(dish, sizeId);
    if (res === "login") onNeedLogin();
  }

  return (
    <div className="overflow-hidden rounded-[22px] bg-surface shadow-card">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <FoodImg src={dish.imageUrl} alt={dish.name} className="h-32 w-full object-cover sm:h-36" />
        <div className="px-3 pt-3">
          <p className="line-clamp-2 min-h-[2.4em] text-[13px] font-bold leading-snug text-ink">{dish.name}</p>
          {!hideRestaurant && <p className="mt-0.5 truncate text-[11px] text-muted">{r?.name}</p>}
          <p className="mt-1 text-sm font-bold text-primary tabular">{inr(price)}</p>
        </div>
      </button>
      <div className="flex justify-center px-3 pt-2 pb-3">
        {qty === 0 ? (
          <button
            type="button"
            onClick={add}
            className="h-11 min-w-[88px] rounded-[10px] border-[1.5px] border-primary bg-surface px-5 text-[13px] font-bold text-primary"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-1 rounded-[10px] bg-primary px-1 py-1 text-white">
            <button type="button" onClick={() => setQty(line, -1)} className="flex size-10 items-center justify-center" aria-label="Less">
              <Minus className="size-4" />
            </button>
            <span className="min-w-5 text-center text-[13px] font-bold tabular">{qty}</span>
            <button type="button" onClick={() => setQty(line, 1)} className="flex size-10 items-center justify-center" aria-label="More">
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
