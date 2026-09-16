export default function DishCard({ dish, onEdit, onToggle }) {
  return (
    <div className="card overflow-hidden transition hover:shadow-lift">
      {/* ================= IMAGE ================= */}
      <div className="relative h-40 bg-z-page">
        <img
          src={dish.imageUrl || "/food-placeholder.png"}
          alt={dish.name}
          className="w-full h-full object-cover"
          onError={(e) => (e.target.src = "/food-placeholder.png")}
        />

        <span
          className={`absolute top-3 right-3 rounded-full px-3 py-1 text-[11px] font-bold ${
            dish.isAvailable ? "tone-go" : "bg-z-ink/70 text-white"
          }`}
        >
          {dish.isAvailable ? "Live" : "Unavailable"}
        </span>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-z-ink truncate">{dish.name}</h3>
            {dish.description && (
              <p className="text-sm text-z-sub line-clamp-2">{dish.description}</p>
            )}
          </div>
          <div className="text-base font-bold text-z-ink shrink-0">₹{dish.price}</div>
        </div>

        {(dish.isVegetarian || dish.isVegan || dish.isGlutenFree) && (
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {dish.isVegetarian && <span className="rounded-full px-2 py-1 font-bold tone-go">🌱 Veg</span>}
            {dish.isVegan && <span className="rounded-full px-2 py-1 font-bold tone-go">🥬 Vegan</span>}
            {dish.isGlutenFree && (
              <span className="rounded-full px-2 py-1 font-bold bg-z-sage text-z-primary">
                🚫 Gluten Free
              </span>
            )}
          </div>
        )}
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="px-4 py-3 border-t border-z-line-soft flex gap-2">
        <button onClick={onEdit} className="btn-ghost flex-1 h-10 text-sm py-0">
          Edit
        </button>
        <button
          onClick={onToggle}
          className={`flex-1 h-10 rounded-xl text-sm font-bold transition ${
            dish.isAvailable ? "tone-stop" : "tone-go"
          }`}
        >
          {dish.isAvailable ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}
