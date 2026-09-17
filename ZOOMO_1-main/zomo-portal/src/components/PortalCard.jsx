import { FiArrowRight } from "react-icons/fi";

export default function PortalCard({ icon, title, description, buttonText, href, badge }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card group block relative p-8 transition-all duration-300 hover:shadow-lift hover:-translate-y-1.5 cursor-pointer animate-slide-up"
    >
      {badge && (
        <span className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full bg-z-sage text-z-primary">
          {badge}
        </span>
      )}

      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 bg-z-sage">
        {icon}
      </div>

      <h2 className="text-2xl font-bold text-z-ink mb-3">{title}</h2>

      <p className="text-z-sub text-sm leading-relaxed mb-8">{description}</p>

      <div className="flex items-center gap-2 text-sm font-semibold text-z-accent group-hover:gap-4 transition-all">
        {buttonText}
        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
      </div>
    </a>
  );
}
