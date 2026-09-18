import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export type BackFallback = "/" | "/restaurants" | "/cart" | "/orders" | "/profile" | "/search";

const PATH_KEY = "zoomo:path";
const PREV_KEY = "zoomo:prev";
const HUB_KEY = "zoomo:hub";

function isRestaurantMenu(pathname: string) {
  // /restaurant/:id — not the /restaurants list
  return pathname.startsWith("/restaurant/");
}

function read(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function asFallback(path: string | null, fallback: BackFallback): BackFallback {
  if (
    path === "/" ||
    path === "/restaurants" ||
    path === "/cart" ||
    path === "/orders" ||
    path === "/profile" ||
    path === "/search"
  ) {
    return path;
  }
  return fallback;
}

/** Remember the last non-menu page so Back never lands on a restaurant menu. */
export function rememberLocation(pathname: string) {
  if (typeof window === "undefined") return;
  const current = read(PATH_KEY);
  if (current === pathname) return;
  if (current) write(PREV_KEY, current);
  write(PATH_KEY, pathname);
  const fromMenu = isRestaurantMenu(current || "");
  if (!isRestaurantMenu(pathname) && pathname !== "/login" && pathname !== "/signup" && !fromMenu) {
    write(HUB_KEY, pathname);
  }
}

export function useLocationMemory() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    rememberLocation(pathname);
  }, [pathname]);
}

export function useGoBack(fallback: BackFallback = "/") {
  const nav = useNavigate();
  return () => {
    const hub = asFallback(read(HUB_KEY), fallback);
    nav({ to: hub });
  };
}
