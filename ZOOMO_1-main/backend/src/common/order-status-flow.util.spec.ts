import { OrderStatus, OrderType } from "@prisma/client";
import { canTransition } from "./order-status-flow.util";

describe("canTransition", () => {
  it("lets restaurant or admin accept a pending order", () => {
    expect(canTransition({ status: OrderStatus.PENDING, orderType: OrderType.DELIVERY }, OrderStatus.PREPARING)).toBe(true);
  });

  it("is a no-op when the order is already in that status", () => {
    expect(canTransition({ status: OrderStatus.PREPARING, orderType: OrderType.DELIVERY }, OrderStatus.PREPARING)).toBe(true);
  });

  it("lets pickup skip out-for-delivery and complete from ready", () => {
    expect(canTransition({ status: OrderStatus.READY_FOR_PICKUP, orderType: OrderType.PICKUP }, OrderStatus.DELIVERED)).toBe(true);
    expect(canTransition({ status: OrderStatus.READY_FOR_PICKUP, orderType: OrderType.DELIVERY }, OrderStatus.DELIVERED)).toBe(false);
  });

  it("rejects skipping kitchen steps", () => {
    expect(canTransition({ status: OrderStatus.PENDING, orderType: OrderType.DELIVERY }, OrderStatus.DELIVERED)).toBe(false);
  });
});
