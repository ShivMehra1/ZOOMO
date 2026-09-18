import { OrderStatus, OrderType } from "@prisma/client";

const CAN_CANCEL = new Set<OrderStatus>([
  OrderStatus.SCHEDULED,
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
]);

/** Kitchen steps both the restaurant panel and Admin may take. */
export function allowedKitchenNext(
  order: { status: OrderStatus; orderType: OrderType },
): OrderStatus[] {
  switch (order.status) {
    case OrderStatus.SCHEDULED:
      return [OrderStatus.PENDING];
    case OrderStatus.PENDING:
      return [OrderStatus.PREPARING];
    case OrderStatus.PREPARING:
      return [OrderStatus.READY_FOR_PICKUP];
    case OrderStatus.READY_FOR_PICKUP:
      return order.orderType === OrderType.DELIVERY
        ? [OrderStatus.OUT_FOR_DELIVERY]
        : [OrderStatus.DELIVERED];
    case OrderStatus.OUT_FOR_DELIVERY:
      return [OrderStatus.DELIVERED];
    default:
      return [];
  }
}

export function canTransition(
  order: { status: OrderStatus; orderType: OrderType },
  next: OrderStatus,
): boolean {
  if (order.status === next) return true;
  if (next === OrderStatus.CANCELLED && CAN_CANCEL.has(order.status)) return true;
  return allowedKitchenNext(order).includes(next);
}
