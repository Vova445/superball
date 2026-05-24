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
      <img
        src="/assets/logo_ball.svg"
        width={icon}
        height={icon}
        alt="MEGABOL Logo"
        className="shrink-0"
      />
      {showWordmark && (
        <span className={`arcade-heading gradient-text-arcade ${text} text-glow-purple`}>
          MEGABOL
        </span>
      )}
    </div>
  );
}
