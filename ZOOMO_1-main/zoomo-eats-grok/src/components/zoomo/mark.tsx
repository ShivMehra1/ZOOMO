export function ZoomoMark({
  size = 36,
  onGreen = false,
  className = "",
}: {
  size?: number;
  onGreen?: boolean;
  className?: string;
}) {
  return (
    <img
      src={onGreen ? "/brand/mark-on-white.png" : "/brand/mark-on-green.png"}
      alt="Zoomo"
      width={size}
      height={size}
      className={`shrink-0 rounded-[22%] object-contain ${onGreen ? "bg-white shadow-sm" : ""} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function ZoomoWordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <ZoomoMark onGreen={light} />
      <span className={`text-base font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Zoomo Eats
      </span>
    </span>
  );
}
