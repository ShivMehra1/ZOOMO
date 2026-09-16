import { canCancelOrder } from "../utils/orderStatus";

export default function CancelOrderButton({ status, onCancel }) {
  if (!canCancelOrder(status)) return null;

  return (
    <button
      onClick={() => {
        const confirmCancel = window.confirm(
          "Are you sure you want to cancel this order?"
        );
        if (confirmCancel) onCancel();
      }}
      className="btn-ghost h-11 px-4 text-sm text-z-danger border-z-danger/30 hover:border-z-danger hover:text-z-danger"
    >
      Cancel Order
    </button>
  );
}
