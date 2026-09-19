import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ConflictModal } from "@/components/zoomo/modals";
import { applyCatalog, getRealToken, loadRealCatalog, type CatalogPayload } from "@/lib/real-api";
import { useLocationMemory } from "@/lib/zoomo-nav";
import { useZoomo } from "@/lib/zoomo-store";
import appCss from "../styles.css?url";

const APP_NAME = "Zoomo Eats";

export const Route = createRootRoute({
  loader: async (): Promise<{ catalog: CatalogPayload }> => {
    const catalog = await loadRealCatalog();
    if (typeof window !== "undefined" && getRealToken()) {
      const { refreshCart, refreshAddresses, refreshOrders, refreshFavorites, refreshProfile } = useZoomo.getState();
      await Promise.all([refreshCart(), refreshAddresses(), refreshOrders(), refreshFavorites(), refreshProfile()]);
    }
    return { catalog };
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

function BagConflictHost() {
  const { conflict, confirmReplaceCart, cancelReplaceCart } = useZoomo();
  if (!conflict) return null;
  return <ConflictModal onCancel={cancelReplaceCart} onConfirm={confirmReplaceCart} />;
}

function ToastHost() {
  const toast = useZoomo((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(4.75rem+env(safe-area-inset-top))] z-[100] flex justify-center px-4">
      <p className="rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-lift">{toast}</p>
    </div>
  );
}

function RootComponent() {
  const { catalog } = Route.useLoaderData();
  applyCatalog(catalog);

  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <LocationMemory />
          <BagConflictHost />
          <ToastHost />
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
