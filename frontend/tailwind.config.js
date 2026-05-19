/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  safelist: [
    "arcade-bg",
    "arcade-card",
    "arcade-heading",
    "bg-megaball-dark",
    "bg-megaball-surface",
    "text-megaball-cyan",
    "border-megaball-border",
    "shadow-neon-cyan",
    "shadow-neon-purple",
    "animate-glow",
    "animate-pulse",
  ],
  theme: {
    extend: {
      colors: {
        megaball: {
          purple: "#7B2FFF",
          cyan: "#00F5FF",
          dark: "#0D0D1A",
          surface: "#141428",
          border: "#2A2A4A",
          muted: "#6B6B8A",
        },
        rarity: {
          common: "#888888",
          rare: "#378ADD",
          epic: "#7F77DD",
          legendary: "#BA7517",
          mythic: "#D85A30",
        },
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        rajdhani: ["var(--font-rajdhani)", "sans-serif"],
        heading: ["var(--font-orbitron)", "sans-serif"],
        body: ["var(--font-rajdhani)", "sans-serif"],
      },
      spacing: {
        4.5: "1.125rem",
        13: "3.25rem",
        15: "3.75rem",
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      borderRadius: {
        arcade: "0.75rem",
        "arcade-lg": "1rem",
        "arcade-xl": "1.5rem",
      },
      boxShadow: {
        "neon-purple": "0 0 20px rgba(123, 47, 255, 0.5), 0 0 40px rgba(123, 47, 255, 0.2)",
        "neon-cyan": "0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.2)",
        "neon-card": "0 0 30px rgba(123, 47, 255, 0.15), inset 0 1px 0 rgba(0, 245, 255, 0.1)",
        "glow-sm": "0 0 12px currentColor",
        "glow-md": "0 0 24px currentColor",
      },
      backgroundImage: {
        "arcade-grid":
          "linear-gradient(rgba(123, 47, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(123, 47, 255, 0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        glow: {
          "0%, 100%": {
            boxShadow:
              "0 0 16px rgba(123, 47, 255, 0.35), 0 0 32px rgba(0, 245, 255, 0.15)",
          },
          "50%": {
            boxShadow:
              "0 0 24px rgba(0, 245, 255, 0.55), 0 0 48px rgba(123, 47, 255, 0.35)",
          },
        },
      },
      animation: {
        pulse: "pulse 2s ease-in-out infinite",
        glow: "glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
