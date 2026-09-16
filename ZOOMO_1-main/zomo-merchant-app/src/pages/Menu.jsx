import { useEffect, useState } from "react";
import DishCard from "../components/DishCard";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Menu() {
  const navigate = useNavigate();

  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch menu (merchant's own restaurant)
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get("/merchant/dishes");
        setDishes(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load menu"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Toggle availability
  const toggleAvailability = async (dishId) => {
    try {
      await api.patch(`/merchant/dishes/${dishId}/toggle`);

      setDishes((prev) =>
        prev.map((d) =>
          d.id === dishId
            ? { ...d, isAvailable: !d.isAvailable }
            : d
        )
      );
    } catch {
      alert("Failed to update availability");
    }
  };

  if (loading) {
    return <p className="text-z-sub text-sm py-12 text-center">Loading menu...</p>;
  }

  if (error) {
    return <p className="text-z-danger text-sm">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="kicker mb-1">Menu</p>
          <h1 className="display text-2xl text-z-ink">Menu</h1>
          <p className="text-sm text-z-sub mt-1">Manage dishes visible to customers</p>
        </div>

        <button onClick={() => navigate("/menu/add")} className="btn-primary h-11 px-5 text-sm">
          + Add Dish
        </button>
      </div>

      {dishes.length === 0 ? (
        <div className="card p-10 flex flex-col items-center justify-center text-center mt-4">
          <img src="/zoomo-mascot.png" alt="No dishes" className="w-24 opacity-40 mb-4" />
          <h3 className="text-lg font-bold text-z-ink">No dishes yet</h3>
          <p className="text-sm text-z-sub mb-4">
            Start building your menu by adding your first dish
          </p>
          <button onClick={() => navigate("/menu/add")} className="btn-primary h-11 px-5 text-sm">
            Add Your First Dish
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              onEdit={() => navigate(`/menu/edit/${dish.id}`)}
              onToggle={() => toggleAvailability(dish.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
