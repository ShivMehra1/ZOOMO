import { useEffect, useState } from "react";
import OrderCard from "../components/OrderCard";
import OrderFilters from "../components/OrderFilters";
import { ORDER_FILTERS } from "../utils/orderFilters";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Orders() {
  const navigate = useNavigate();

  const [restaurantId, setRestaurantId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const restaurantRes = await api.get("/merchant/restaurants/me");
        const restId = restaurantRes.data.id;
        setRestaurantId(restId);

        const ordersRes = await api.get(
          `/merchant/restaurants/${restId}/orders`
        );

        const normalized = ordersRes.data.map((order) => ({
          id: order.id,
          customerName: order.user?.name || "Customer",
          status: order.status,
          total: order.total,
          items: order.items,
          createdAt: order.createdAt,
          // ✅ Pass these through so OrderCard can display them
          orderType: order.orderType || "DELIVERY",
          scheduledFor: order.scheduledFor || null,
          guestCount: order.guestCount || null,
        }));

        setOrders(normalized);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(ORDER_FILTERS[activeFilter].match);

  if (loading) return <p className="text-z-sub text-sm py-12 text-center">Loading orders...</p>;
  if (error) return <p className="text-z-danger text-sm">{error}</p>;

  return (
    <div className="space-y-5">
      <div>
        <p className="kicker mb-1">Kitchen</p>
        <h1 className="display text-2xl text-z-ink">Orders</h1>
      </div>

      <OrderFilters active={activeFilter} onChange={setActiveFilter} />

      {filteredOrders.length === 0 ? (
        <div className="card p-8 text-center text-sm text-z-sub">
          No orders in this category.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => navigate(`/orders/${restaurantId}/${order.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
