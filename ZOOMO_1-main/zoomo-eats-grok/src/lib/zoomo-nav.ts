import { useNavigate, useRouter } from "@tanstack/react-router";

export function useGoBack(fallback: "/" | "/restaurants" | "/cart" | "/orders" | "/profile" = "/") {
  const nav = useNavigate();
  const router = useRouter();
  return () => {
    const hist = router.history as { canGoBack?: () => boolean; back: () => void };
    if (typeof hist.canGoBack === "function" ? hist.canGoBack() : false) {
      hist.back();
      return;
    }
    nav({ to: fallback });
  };
}
