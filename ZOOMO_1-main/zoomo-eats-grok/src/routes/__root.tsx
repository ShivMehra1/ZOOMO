import { useEffect, useState } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { getRealToken, loadRealCatalog } from "@/lib/real-api";
import { useLocationMemory } from "@/lib/zoomo-nav";
import { useZoomo } from "@/lib/zoomo-store";
import appCss from "../styles.css?url";

const APP_NAME = "Zoomo Eats";

export const Route = createRootRoute({
  loader: async () => {
    if (typeof window === "undefined") return;
    await loadRealCatalog();
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
        content: "Zoomo Eats — food delivery in Jourian. Zoom it. Eat it. Love it.",
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

function BootScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6">
      <img src="/brand/mark-on-white.png" alt="Zoomo" className="mb-5 size-14 object-contain" />
      <p className="text-sm font-bold tracking-wide text-ink">Loading kitchens in Jourian…</p>
    </div>
  );
}

function RootComponent() {
  const [ready, setReady] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    loadRealCatalog()
      .then(() => {
        if (!alive) return;
        const token = getRealToken();
        if (!token) return;
        const { refreshCart, refreshAddresses, refreshOrders, refreshFavorites, refreshProfile } = useZoomo.getState();
        return Promise.all([refreshCart(), refreshAddresses(), refreshOrders(), refreshFavorites(), refreshProfile()]);
      })
      .finally(() => {
        if (!alive) return;
        setCatalogVersion((v) => v + 1);
        setReady(true);
      });
    return () => {
      alive = false;
    };
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
          {ready ? <Outlet key={catalogVersion} /> : <BootScreen />}
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
