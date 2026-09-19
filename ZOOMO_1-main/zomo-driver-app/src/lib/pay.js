export function payLabel(method) {
  const m = (method || "COD").toUpperCase();
  if (m === "COD" || m === "CASH") return "Cash on delivery";
  if (m === "UPI") return "UPI";
  if (m === "CARD") return "Card";
  if (m === "PAY_AT_RESTAURANT") return "Pay at restaurant";
  if (m === "ONLINE") return "Paid online";
  return method || "Cash on delivery";
}

export function isCashCollect(method) {
  const m = (method || "COD").toUpperCase();
  return m === "COD" || m === "CASH" || m === "PAY_AT_RESTAURANT";
}
