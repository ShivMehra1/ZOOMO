import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { FiNavigation } from "react-icons/fi";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

/* ================= CONSTANTS ================= */
const REROUTE_DISTANCE_METERS = 30;
const PICKUP_RADIUS_METERS = 150;
const DELIVERY_RADIUS_METERS = 100;

/* ================= HELPERS ================= */
const toRad = (d) => (d * Math.PI) / 180;

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.cos(toRad(lng2 - lng1));

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/* ================= COMPONENT ================= */
export default function DriverMap({ restaurant, customer, status }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);

  const prevDriverLocRef = useRef(null);
  const lastRerouteRef = useRef(null);
  const routeGeoRef = useRef(null);

  const [driverLoc, setDriverLoc] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);

  const isPickupPhase = status === "READY_FOR_PICKUP";
  const to = isPickupPhase ? restaurant : customer;

  /* ================= DAY / NIGHT ================= */
  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;

  const mapStyle = isNight
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/standard";

  /* ================= GPS ================= */
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setDriverLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ================= MAP INIT ================= */
  useEffect(() => {
    if (!driverLoc || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [driverLoc.lng, driverLoc.lat],
      zoom: 15,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      const car = document.createElement("div");
      car.innerText = "🚗";
      car.style.fontSize = "28px";

      driverMarkerRef.current = new mapboxgl.Marker(car)
        .setLngLat([driverLoc.lng, driverLoc.lat])
        .addTo(map);
    });
  }, [driverLoc, mapStyle]);

  /* ================= DRIVER MOVE ================= */
  useEffect(() => {
    if (!driverMarkerRef.current || !driverLoc) return;

    const prev = prevDriverLocRef.current;
    if (prev) {
      driverMarkerRef.current.setRotation(
        getBearing(prev.lat, prev.lng, driverLoc.lat, driverLoc.lng)
      );
    }

    driverMarkerRef.current.setLngLat([driverLoc.lng, driverLoc.lat]);
    prevDriverLocRef.current = driverLoc;
  }, [driverLoc]);

  /* ================= ROUTE DRAW ================= */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverLoc || !to?.lat || !to?.lng) return;

    const last = lastRerouteRef.current;
    if (
      last &&
      getDistanceMeters(last.lat, last.lng, driverLoc.lat, driverLoc.lng) <
        REROUTE_DISTANCE_METERS
    )
      return;

    lastRerouteRef.current = driverLoc;

    async function fetchRoute() {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLoc.lng},${driverLoc.lat};${to.lng},${to.lat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
      );

      const data = await res.json();
      if (!data.routes?.length) return;

      const route = data.routes[0];
      routeGeoRef.current = {
        type: "Feature",
        geometry: route.geometry,
      };

      setRouteInfo({
        distance: (route.distance / 1000).toFixed(1),
        duration: Math.ceil(route.duration / 60),
      });

      addOrUpdateRoute(map);
    }

    fetchRoute();
  }, [driverLoc, to]);

  /* ================= RE-ADD ROUTE ON STYLE LOAD ================= */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onStyleLoad = () => {
      if (!routeGeoRef.current) return;
      addOrUpdateRoute(map);
    };

    map.on("style.load", onStyleLoad);
    return () => map.off("style.load", onStyleLoad);
  }, []);

  function addOrUpdateRoute(map) {
    if (map.getSource("route")) {
      map.getSource("route").setData(routeGeoRef.current);
      return;
    }

    map.addSource("route", {
      type: "geojson",
      data: routeGeoRef.current,
    });

    const layers = map.getStyle().layers;
    let beforeId = null;

    for (const layer of layers) {
      if (layer.type === "symbol" && layer.source === "composite") {
        beforeId = layer.id;
        break;
      }
    }

    map.addLayer(
      {
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#10b981",
          "line-width": 8,
        },
      },
      beforeId
    );
  }

  /* ================= ARRIVAL ================= */
  useEffect(() => {
    if (!driverLoc || !to?.lat || !to?.lng) return;

    const radius = isPickupPhase
      ? PICKUP_RADIUS_METERS
      : DELIVERY_RADIUS_METERS;

    setHasArrived(
      getDistanceMeters(
        driverLoc.lat,
        driverLoc.lng,
        to.lat,
        to.lng
      ) <= radius
    );
  }, [driverLoc, to, isPickupPhase]);

  /* ================= DEST MARKER ================= */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !to?.lat || !to?.lng) return;

    destinationMarkerRef.current?.remove();

    const el = document.createElement("div");
    el.innerText = isPickupPhase ? "🍴" : "🏠";
    el.style.fontSize = "28px";

    destinationMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([to.lng, to.lat])
      .addTo(map);
  }, [to, isPickupPhase]);

  return (
    <div className="relative w-full h-64 rounded-card overflow-hidden shadow-card">
      {routeInfo && (
        <div className="absolute bottom-3 left-3 bg-white/90 px-4 py-2 rounded-xl text-sm font-bold flex gap-2 items-center">
          <FiNavigation size={14} />
          {routeInfo.duration} min · {routeInfo.distance} km
        </div>
      )}

      {hasArrived && (
        <div className="absolute top-3 left-3 badge bg-z-primary text-white">
          Arrived
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
