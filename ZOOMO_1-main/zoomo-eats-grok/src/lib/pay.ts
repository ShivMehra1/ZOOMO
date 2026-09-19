export function payLabel(method?: string | null) {
  const m = (method || "COD").toUpperCase();
  if (m === "COD" || m === "CASH") return "Cash on delivery";
  if (m === "UPI") return "UPI";
  if (m === "CARD") return "Card";
  if (m === "PAY_AT_RESTAURANT") return "Pay at restaurant";
  if (m === "ONLINE") return "Paid online";
  return method || "Cash on delivery";
}

export function isCashCollect(method?: string | null) {
  const m = (method || "COD").toUpperCase();
  return m === "COD" || m === "CASH" || m === "PAY_AT_RESTAURANT";
}

export function pinFromId(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return String(1000 + (n % 9000));
}

export function deliveryPinOf(order: { id: string; deliveryPin?: string | null }) {
  return order.deliveryPin || pinFromId(order.id);
}
