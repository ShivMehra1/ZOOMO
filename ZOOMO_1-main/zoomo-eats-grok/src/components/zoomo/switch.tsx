/** Oval track. White trigger stays inside: left when off, slides to the right when on. Logo green when on. */
export function GreenSwitch({
  on,
  onToggle,
  label,
  caption,
  disabled,
  size = "md",
}: {
  on: boolean;
  onToggle: () => void;
  label?: string;
  caption?: string;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const large = size === "lg";
  return (
    <span className="inline-flex flex-col items-center gap-1.5">
      {caption ? (
        <span className="text-[13px] font-medium text-[#8E8E93] leading-none">{caption}</span>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label || caption}
        disabled={disabled}
        onClick={onToggle}
        className={`relative shrink-0 overflow-hidden rounded-full p-[3px] transition-colors duration-200 ease-out disabled:opacity-50 ${
          large ? "h-11 w-[76px]" : "h-8 w-[52px]"
        }`}
        style={{ backgroundColor: on ? "#0F3D2D" : "#E6E6EA" }}
      >
        <span
          className={`block rounded-full bg-white transition-transform duration-200 ease-out ${
            large ? "size-[38px]" : "size-[26px]"
          } ${on ? (large ? "translate-x-[32px]" : "translate-x-[20px]") : "translate-x-0"}`}
          style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.22), 0 1px 2px rgba(0,0,0,0.08)" }}
        />
      </button>
    </span>
  );
}
