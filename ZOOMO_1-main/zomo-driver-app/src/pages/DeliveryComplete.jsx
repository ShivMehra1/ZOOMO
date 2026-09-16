import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function DeliveryComplete() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-z-page flex flex-col items-center justify-center px-4 pb-28 text-center relative overflow-hidden">
      <img
        src="/pattern.svg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-5"
      />

      <div className="relative">
        <img
          src="/zoomo-mascot.png"
          alt="Delivery complete"
          className="h-44 mx-auto mb-6"
        />

        <p className="kicker mb-2">Done</p>
        <h1 className="display text-2xl text-z-ink">
          Delivery completed
        </h1>

        <p className="mt-2 text-sm text-z-sub max-w-xs mx-auto">
          Nice work! You're all set to accept your next delivery.
        </p>

        <button
          onClick={() => navigate("/orders")}
          className="btn-primary mt-8 w-full max-w-sm mx-auto h-14"
        >
          Back to orders
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
