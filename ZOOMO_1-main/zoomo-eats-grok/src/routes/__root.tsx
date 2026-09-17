import { useEffect, useState } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { getRealToken, isCatalogLoaded, loadRealCatalog } from "@/lib/real-api";
import { useLocationMemory } from "@/lib/zoomo-nav";
import { useZoomo } from "@/lib/zoomo-store";
import appCss from "../styles.css?url";

const APP_NAME = "Zoomo Eats";

export const Route = createRootRoute({
  loader: async () => {
    await loadRealCatalog();
    // Refresh this account's real cart/addresses/orders on a hard page load
    // (client-side nav after login already does this in the store's login()).
    if (getRealToken()) {
      const { refreshCart, refreshAddresses, refreshOrders, refreshFavorites, refreshProfile } = useZoomo.getState();
      await Promise.all([refreshCart(), refreshAddresses(), refreshOrders(), refreshFavorites(), refreshProfile()]);
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0F3D2D" },
      {
        name: "description",
        content:
          "Zoomo Eats — food delivery in Jourian. Zoom it. Eat it. Love it.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://api.fontshare.com" },
      { rel: "preconnect", href: "https://cdn.fontshare.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900,400italic,700italic&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function LocationMemory() {
  useLocationMemory();
  return null;
}

/**
 * TanStack Start's SSR render always has the real catalog (the root `loader`
 * above blocks it server-side), which is why `curl`/view-source always look
 * correct. But nothing guarantees that loader re-runs client-side after
 * hydration — if it doesn't, every mounted route silently keeps reading the
 * bundle's original static demo arrays (fake dish ids and all), and every
 * "add to cart" 404s against the real backend forever, even after a hard
 * refresh.
 *
 * First paint must render *identically* on server and client (any difference
 * here is a hydration-mismatch crash, not a warning — learned that the hard
 * way with a conditional-loading-screen version of this). So instead of
 * branching what renders, this always renders `<Outlet>` and, once the
 * client's own `loadRealCatalog()` confirms real data is in place, bumps
 * `key` to force a clean one-time remount — a plain post-mount state update,
 * not part of hydration, so React treats it as an ordinary re-render.
 */
function RootComponent() {
  const [catalogVersion, setCatalogVersion] = useState(0);

  useEffect(() => {
    if (isCatalogLoaded()) return; // SSR's fetch already covered this client instance too
    loadRealCatalog().then(() => setCatalogVersion((v) => v + 1));
  }, []);

  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <LocationMemory />
          <Outlet key={catalogVersion} />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
