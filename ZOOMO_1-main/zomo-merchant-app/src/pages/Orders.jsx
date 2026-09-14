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

  if (loading) return <p className="text-gray-500">Loading orders...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Orders</h1>

      <OrderFilters active={activeFilter} onChange={setActiveFilter} />

      {filteredOrders.length === 0 ? (
        <p className="text-gray-500">No orders in this category.</p>
      ) : (
        <div className="grid gap-4">
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