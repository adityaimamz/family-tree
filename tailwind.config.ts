import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        "surface-soft": "hsl(var(--surface-soft))",
        "text-primary": "hsl(var(--text))",
        "text-muted": "hsl(var(--muted))",
        "border-soft": "hsl(var(--border))",
        "warm-brown": "hsl(var(--warm-brown))",
        "sage-green": "hsl(var(--sage-green))",
        "soft-blue": "hsl(var(--soft-blue))",
        terracotta: "hsl(var(--terracotta))",
        "soft-gold": "hsl(var(--soft-gold))",
        "dark-green": "hsl(var(--dark-green))",
        warning: "hsl(var(--warning))",
      },
      fontFamily: {
        body: ["Outfit", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      boxShadow: {
        warm: "0 22px 60px -34px rgba(99, 72, 44, 0.55)",
        soft: "0 16px 36px -28px rgba(80, 54, 30, 0.55)",
      },
      backgroundImage: {
        "archive-texture":
          "radial-gradient(circle at 1px 1px, rgba(111,87,61,.12) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
} satisfies Config;
