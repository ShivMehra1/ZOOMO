import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import { MascotLoader } from "./LandingPage";
import { getFavorites, toggleFavorite } from "../utils/prefs";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39", accent: "#1F7A52",
  textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E", border: "#DCE6E0", borderSoft: "#EEF3F0",
};

const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  ),
  Star: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Plus: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Minus: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Cart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  Heart: ({ filled }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#0F3D2D" : "none"} stroke={filled ? "#0F3D2D" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
};

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, increaseQuantity, decreaseQuantity, restaurantConflict, confirmReplaceCart, cancelReplaceCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [favorited, setFavorited] = useState(() => getFavorites().includes(id));
  const [category, setCategory] = useState("All");
  const [chosenSize, setChosenSize] = useState({});
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  async function load() {
    try {
      const [rest, menu] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/dishes?restaurantId=${id}`),
      ]);
      setRestaurant(rest);
      setDishes(Array.isArray(menu) ? menu : []);
    } catch { setRestaurant(null); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const categories = ["All", ...new Set(dishes.map(d => d.category).filter(Boolean))];
  const visibleDishes = category === "All" ? dishes : dishes.filter(d => d.category === category);

  function sizeFor(dish) {
    if (!dish.sizes?.length) return null;
    return chosenSize[dish.id] ?? dish.sizes[0].id;
  }

  function priceFor(dish) {
    const sizeId = sizeFor(dish);
    if (!sizeId) return dish.price;
    return dish.sizes.find(s => s.id === sizeId)?.price ?? dish.price;
  }

  async function handleAdd(dish) {
    setAddingId(dish.id);
    await addToCart(dish.id, sizeFor(dish));
    setAddingId(null);
  }

  async function submitReview() {
    setSubmittingReview(true);
    try {
      await api.post(`/restaurants/${id}/reviews`, { rating: reviewRating, comment: reviewComment.trim() || undefined });
      setReviewComment("");
      setReviewRating(5);
      await load();
    } catch (err) {
      console.error("❌ Failed to submit review:", err);
    } finally {
      setSubmittingReview(false);
    }
  }

  const totalItems = cart?.items?.reduce((t, i) => t + i.quantity, 0) ?? 0;

  if (loading) return <MascotLoader text="Loading menu..." />;

  if (!restaurant) return (
    <div style={{
      minHeight: "100vh", background: C.page, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'Satoshi', system-ui, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🍽️</div>
        <p style={{ color: C.textSub, marginBottom: 16 }}>Restaurant not found</p>
        <button onClick={() => navigate(-1)}
          style={{
            padding: "10px 22px", borderRadius: 12, border: "none", background: C.primary,
            color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit"
          }}>
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: C.page, paddingBottom: totalItems > 0 ? 96 : 32,
      fontFamily: "'Satoshi', system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>

      {/* Hero Banner */}
      <div style={{ position: "relative", height: 240, overflow: "hidden" }}>
        <img src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop"}
          alt={restaurant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(11,15,14,0.85) 0%, rgba(11,15,14,0.2) 60%, rgba(11,15,14,0.35) 100%)"
        }} />

        <button onClick={() => navigate(-1)}
          style={{
            position: "absolute", top: 16, left: 16, width: 38, height: 38, borderRadius: 12,
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", color: C.textMain,
            cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}>
          <Icon.ArrowLeft />
        </button>

        <button onClick={() => setFavorited(toggleFavorite(id).includes(id))}
          style={{
            position: "absolute", top: 16, right: 16, width: 38, height: 38, borderRadius: 12,
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", color: C.textMain,
            cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
          aria-label="Save restaurant">
          <Icon.Heart filled={favorited} />
        </button>

        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
          <h1 style={{
            color: "#fff", fontSize: 28, fontWeight: 700, letterSpacing: "-0.015em",
            textShadow: "0 2px 8px rgba(0,0,0,0.3)"
          }}>
            {restaurant.name}
          </h1>
          <div style={{
            display: "flex", alignItems: "center", gap: 14, marginTop: 6,
            color: "rgba(255,255,255,0.85)", fontSize: 13
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Icon.Star /> {restaurant.rating?.toFixed(1) ?? "4.3"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Icon.Clock /> 25-40 min
            </span>
            <span>{restaurant.cuisineType || "Various"}</span>
          </div>
          {restaurant.description && (
            <p style={{
              color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480
            }}>
              {restaurant.description}
            </p>
          )}
        </div>
      </div>

      {/* Menu */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px" }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, color: C.textMain, marginBottom: 18, letterSpacing: "-0.01em" }}>
          Menu
        </h2>

        {categories.length > 1 && (
          <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 18 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0, padding: "7px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                  border: `1.5px solid ${category === cat ? C.primary : C.border}`,
                  background: category === cat ? C.primary : C.surface,
                  color: category === cat ? "#fff" : C.textSub,
                  transition: "all 120ms ease-out",
                }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {visibleDishes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.5 }}>🍽️</div>
            <p style={{ color: C.textSub }}>No dishes available right now</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {visibleDishes.map(dish => {
              const activeSizeId = sizeFor(dish);
              const item = cart?.items?.find(i => i.dish?.id === dish.id && (i.dishSizeId || null) === (activeSizeId || null));
              const qty = item?.quantity ?? 0;
              const isAdding = addingId === dish.id;

              return (
                <div key={dish.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: 16, borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`,
                  transition: "border-color 120ms"
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + "60"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Veg/Non-veg indicator */}
                    <div style={{
                      width: 14, height: 14, borderRadius: 3, marginBottom: 6,
                      border: `2px solid ${dish.isVegetarian ? "#16A34A" : "#DC2626"}`,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: dish.isVegetarian ? "#16A34A" : "#DC2626"
                      }} />
                    </div>
                    <h3 style={{
                      fontWeight: 700, fontSize: 14, color: C.textMain,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>{dish.name}</h3>
                    <p style={{ color: C.primary, fontWeight: 700, fontSize: 14, marginTop: 3 }}>₹{priceFor(dish)}</p>
                    {dish.description && (
                      <p style={{
                        color: C.textMuted, fontSize: 12, marginTop: 4, lineHeight: "16px",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {dish.description}
                      </p>
                    )}
                    {dish.calories && <p style={{ color: C.textMuted, fontSize: 10, marginTop: 4 }}>{dish.calories} kcal</p>}
                    {dish.sizes?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {dish.sizes.map(s => (
                          <button key={s.id}
                            onClick={() => setChosenSize(prev => ({ ...prev, [dish.id]: s.id }))}
                            style={{
                              padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                              border: `1.5px solid ${activeSizeId === s.id ? C.primary : C.border}`,
                              background: activeSizeId === s.id ? C.primary : "transparent",
                              color: activeSizeId === s.id ? "#fff" : C.textSub,
                            }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={dish.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"}
                      alt={dish.name} style={{ width: 88, height: 88, borderRadius: 14, objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)" }}>
                      {qty === 0 ? (
                        <button onClick={() => handleAdd(dish)} disabled={isAdding}
                          style={{
                            display: "flex", alignItems: "center", gap: 4, padding: "6px 16px",
                            borderRadius: 10, background: C.surface, border: `1.5px solid ${C.primary}`,
                            color: C.primary, fontSize: 11, fontWeight: 700, cursor: isAdding ? "default" : "pointer",
                            fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                            transition: "all 120ms"
                          }}
                          onMouseEnter={e => { if (!isAdding) { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = "#fff"; } }}
                          onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.primary; }}
                        >
                          {isAdding ? (
                            <span style={{ display: "flex", gap: 3 }}>
                              {[0, 0.1, 0.2].map((d, i) => (
                                <span key={i} style={{
                                  width: 4, height: 4, borderRadius: "50%", background: C.primary,
                                  display: "inline-block", animation: "bounce 0.7s ease-in-out infinite", animationDelay: `${d}s`
                                }} />
                              ))}
                            </span>
                          ) : (<><Icon.Plus /> ADD</>)}
                        </button>
                      ) : (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6, background: C.primary,
                          borderRadius: 10, padding: "4px 6px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                        }}>
                          <button onClick={() => decreaseQuantity(item)}
                            style={{
                              width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                              background: "transparent", border: "none", color: "#fff", cursor: "pointer", borderRadius: 6
                            }}>
                            <Icon.Minus />
                          </button>
                          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, width: 14, textAlign: "center" }}>{qty}</span>
                          <button onClick={() => increaseQuantity(item)}
                            style={{
                              width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                              background: "transparent", border: "none", color: "#fff", cursor: "pointer", borderRadius: 6
                            }}>
                            <Icon.Plus />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reviews */}
        <div style={{ marginTop: 40, paddingTop: 28, borderTop: `1px solid ${C.borderSoft}` }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: C.textMain, marginBottom: 16, letterSpacing: "-0.01em" }}>
            Reviews {restaurant.reviews?.length > 0 && <span style={{ color: C.textMuted, fontWeight: 500, fontSize: 14 }}>({restaurant.reviews.length})</span>}
          </h2>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>Rate this restaurant</p>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setReviewRating(n)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  aria-label={`${n} stars`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={n <= reviewRating ? C.primary : "none"} stroke={n <= reviewRating ? C.primary : C.border} strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="Share a few words about your order (optional)"
              rows={2}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`,
                fontSize: 13, color: C.textMain, outline: "none", fontFamily: "inherit", resize: "vertical",
                boxSizing: "border-box", marginBottom: 10
              }}
            />
            <button onClick={submitReview} disabled={submittingReview}
              style={{
                padding: "9px 18px", borderRadius: 10, border: "none", background: C.primary,
                color: "#fff", fontWeight: 600, fontSize: 13, cursor: submittingReview ? "default" : "pointer",
                fontFamily: "inherit", opacity: submittingReview ? 0.7 : 1
              }}>
              {submittingReview ? "Submitting…" : "Submit review"}
            </button>
          </div>

          {(!restaurant.reviews || restaurant.reviews.length === 0) ? (
            <p style={{ color: C.textMuted, fontSize: 13 }}>No reviews yet — be the first.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {restaurant.reviews.map(r => (
                <div key={r.id} style={{ padding: 14, borderRadius: 14, background: C.surface, border: `1px solid ${C.borderSoft}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.textMain }}>{r.user?.name || "Guest"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, color: C.primary, fontSize: 12, fontWeight: 700 }}>
                      <Icon.Star /> {r.rating}
                    </span>
                  </div>
                  {r.comment && <p style={{ color: C.textSub, fontSize: 13, lineHeight: "19px" }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Cart Footer */}
      {totalItems > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, padding: 14,
          background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
          borderTop: `1px solid ${C.border}`, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)"
        }}>
          <div style={{ maxWidth: 920, margin: "0 auto" }}>
            <button onClick={() => navigate("/cart")}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 22px", borderRadius: 16, border: "none",
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(15,61,46,0.3)"
              }}>
              <span style={{ background: "rgba(255,255,255,0.18)", padding: "3px 10px", borderRadius: 8, fontSize: 13 }}>
                {totalItems}
              </span>
              <span>View Cart</span>
              <Icon.Cart />
            </button>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {restaurantConflict && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,61,46,0.6)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: C.surface, borderRadius: 24, padding: 28, maxWidth: 380, width: "100%",
            textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🛒</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.textMain, marginBottom: 8 }}>Start a new cart?</h2>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 22, lineHeight: "19px" }}>
              Your cart has items from another restaurant. Adding this will clear your current cart.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={cancelReplaceCart}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, border: `1.5px solid ${C.border}`,
                  background: "transparent", color: C.textSub, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit"
                }}>
                Cancel
              </button>
              <button onClick={confirmReplaceCart}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, border: "none", background: C.primary,
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                }}>
                Yes, replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}