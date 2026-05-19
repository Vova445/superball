interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 32, text: "text-lg" },
  md: { icon: 44, text: "text-2xl" },
  lg: { icon: 56, text: "text-3xl" },
};

export default function Logo({ size = "md", showWordmark = true, className = "" }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`} role="img" aria-label="MEGABOL">
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id="ballGrad" x1="8" y1="8" x2="56" y2="56">
            <stop offset="0%" stopColor="#7B2FFF" />
            <stop offset="100%" stopColor="#00F5FF" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="32" cy="36" r="22" fill="url(#ballGrad)" opacity="0.9" filter="url(#glow)" />
        <ellipse cx="24" cy="28" rx="6" ry="4" fill="white" opacity="0.35" />
        <path
          d="M38 4 L28 30 H36 L26 60 L42 28 H34 L38 4Z"
          fill="#00F5FF"
          stroke="#7B2FFF"
          strokeWidth="1"
          filter="url(#glow)"
        />
      </svg>
      {showWordmark && (
        <span className={`arcade-heading gradient-text-arcade ${text} text-glow-purple`}>
          MEGABOL
        </span>
      )}
    </div>
  );
}
