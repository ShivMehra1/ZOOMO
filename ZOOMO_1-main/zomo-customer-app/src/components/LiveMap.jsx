import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function markerEl(emoji) {
  const el = document.createElement("div");
  el.innerText = emoji;
  el.style.fontSize = "26px";
  el.style.lineHeight = "1";
  el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.35))";
  return el;
}

/**
 * Live order-tracking map: restaurant + destination + (optional) driver,
 * with a driving route drawn between the active leg.
 */
export default function LiveMap({ restaurant, destination, driver, isPickup }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!restaurant?.lat || !restaurant?.lng || !containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [restaurant.lng, restaurant.lat],
      zoom: 13,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.lat, restaurant?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !restaurant?.lat) return;

    function place() {
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};

      markersRef.current.restaurant = new mapboxgl.Marker(markerEl("🍴"))
        .setLngLat([restaurant.lng, restaurant.lat]).addTo(map);

      if (!isPickup && destination?.lat) {
        markersRef.current.destination = new mapboxgl.Marker(markerEl("🏠"))
          .setLngLat([destination.lng, destination.lat]).addTo(map);
      }

      if (driver?.lat && driver?.lng) {
        markersRef.current.driver = new mapboxgl.Marker(markerEl("🛵"))
          .setLngLat([driver.lng, driver.lat]).addTo(map);
      }

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([restaurant.lng, restaurant.lat]);
      if (!isPickup && destination?.lat) bounds.extend([destination.lng, destination.lat]);
      if (driver?.lat) bounds.extend([driver.lng, driver.lat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
    }

    if (map.loaded()) place();
    else map.once("load", place);
  }, [restaurant, destination, driver, isPickup]);

  /* Route line: driver→destination once assigned, else restaurant→destination */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isPickup || !destination?.lat) return;

    const from = driver?.lat ? driver : restaurant;
    if (!from?.lat) return;

    async function drawRoute() {
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
        );
        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return;
        const geo = { type: "Feature", geometry: route.geometry };
        const apply = () => {
          if (map.getSource("zoomo-route")) {
            map.getSource("zoomo-route").setData(geo);
          } else {
            map.addSource("zoomo-route", { type: "geojson", data: geo });
            map.addLayer({
              id: "zoomo-route", type: "line", source: "zoomo-route",
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#1F7A52", "line-width": 5 },
            });
          }
        };
        if (map.loaded()) apply(); else map.once("load", apply);
      } catch {
        // offline / rate-limited — markers alone are still useful
      }
    }
    drawRoute();
  }, [restaurant, destination, driver, isPickup]);

  if (!restaurant?.lat || !restaurant?.lng) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#EEF3F0", color: "#5A6660", fontSize: 13
      }}>
        Map unavailable for this restaurant
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
