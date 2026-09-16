import { useEffect, useState } from "react";
import api from "../services/api";

function Stars({ value }) {
  return (
    <span className="text-z-primary text-sm" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(Math.round(value))}
      <span className="text-z-line">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export default function Reviews() {
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get("/merchant/restaurants/me");
        const restaurantId = meRes.data?.id;
        const fullRes = await api.get(`/restaurants/${restaurantId}`);
        setRestaurant(fullRes.data);
        setReviews(fullRes.data?.reviews ?? []);
      } catch (err) {
        setLoadError(err.response?.data?.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-z-sub text-sm py-12 text-center">Loading reviews...</p>;
  }

  if (loadError) {
    return (
      <div className="card p-6">
        <p className="text-sm text-z-danger">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="kicker mb-1">Customer feedback</p>
        <h1 className="display text-2xl text-z-ink">Reviews</h1>
        <p className="text-sm text-z-sub mt-1">What customers are saying about {restaurant?.name}</p>
      </div>

      <div className="card p-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-z-ink">{(restaurant?.rating ?? 0).toFixed(1)}</p>
          <Stars value={restaurant?.rating ?? 0} />
        </div>
        <div className="text-sm text-z-sub">
          Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="card p-8 text-center text-sm text-z-sub">No reviews yet.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-bold text-z-ink">{r.user?.name || "Customer"}</span>
                </div>
                <span className="text-xs text-z-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-sm text-z-sub">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
