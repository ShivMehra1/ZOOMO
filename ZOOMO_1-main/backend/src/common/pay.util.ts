export function makeDeliveryPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function pinFromId(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return String(1000 + (n % 9000));
}

export function resolveDeliveryPin(order: { id: string; deliveryPin?: string | null }) {
  return order.deliveryPin || pinFromId(order.id);
}

export function isCashCollect(method?: string | null) {
  const m = (method || "COD").toUpperCase();
  return m === "COD" || m === "CASH" || m === "PAY_AT_RESTAURANT";
}
