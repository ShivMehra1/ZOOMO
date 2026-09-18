import { useEffect, useState, type ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { ZoomoChat } from "./chat";
import { MobileDock } from "./dock";
import { ConflictModal, LocationModal } from "./modals";
import { AccountSheet } from "./account-sheet";
import { useZoomo } from "@/lib/zoomo-store";
import { AREAS, DEFAULT_LOCATION } from "@/lib/zoomo-data";

export function AppShell({
  children,
  footer = false,
  header = true,
  dock = true,
  chat = true,
}: {
  children: ReactNode;
  footer?: boolean;
  header?: boolean;
  dock?: boolean;
  chat?: boolean;
}) {
  const { setLocation, markLocationPrompted, conflict, confirmReplaceCart, cancelReplaceCart, user, captureLiveLocation } = useZoomo();
  const [locOpen, setLocOpen] = useState(false);

  useEffect(() => {
    const maybe = () => {
      useZoomo.setState({ hydrated: true });
      const s = useZoomo.getState();
      if (!s.location) s.setLocation(DEFAULT_LOCATION);
    };
    if (useZoomo.persist.hasHydrated()) maybe();
    const unsub = useZoomo.persist.onFinishHydration(maybe);
    const t = setTimeout(maybe, 50);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("zoomo:geo")) return;
    captureLiveLocation().then((a) => {
      if (a && typeof sessionStorage !== "undefined") sessionStorage.setItem("zoomo:geo", "1");
    });
  }, [user, captureLiveLocation]);

  return (
    <div className={`min-h-screen bg-page ${dock ? "pb-20 md:pb-0" : ""}`}>
      {locOpen && (
        <LocationModal
          onSet={(loc) => {
            setLocation(loc);
            setLocOpen(false);
          }}
          onLater={() => {
            markLocationPrompted();
            setLocOpen(false);
          }}
        />
      )}
      {conflict && <ConflictModal onCancel={cancelReplaceCart} onConfirm={confirmReplaceCart} />}
      {header && <Header onLocationClick={() => setLocOpen(true)} />}
      {children}
      {footer && <Footer />}
      <AccountSheet />
      {chat && <ZoomoChat />}
      {dock && <MobileDock />}
    </div>
  );
}
