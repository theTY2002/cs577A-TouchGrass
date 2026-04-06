/**
 * Tailwind config. Edit colors here to tweak palette.
 * Palette: brand-forest, brand-terracotta, bg-paper, bg-white
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-forest": "#748873",
        "brand-terracotta": "#D1A980",
        "bg-paper": "#E5E0D8",
        "bg-white": "#F7F8F6",
        page: "#F7F8F6",
        ink: {
          DEFAULT: "#2f3e34",
          muted: "#5c6b62",
          subtle: "#7a8a80",
        },
      },
      fontFamily: {
        sans: [
          "Geist",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Geist",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        login: ["Nabla", "cursive"],
      },
      fontSize: {
        hero: [
          "clamp(2.1rem, 4.25vw, 3.35rem)",
          { lineHeight: "1.12", letterSpacing: "-0.02em" },
        ],
        "card-title": [
          "1.125rem",
          { lineHeight: "1.45", letterSpacing: "-0.01em" },
        ],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)",
        "card-hover": "0 12px 28px rgba(0,0,0,0.12)",
        image: "0 4px 20px rgba(0,0,0,0.15)",
        fab: "0 2px 6px rgba(0, 0, 0, 0.06), 0 6px 18px rgba(116, 136, 115, 0.22)",
        "fab-hover":
          "0 4px 10px rgba(0, 0, 0, 0.07), 0 10px 26px rgba(116, 136, 115, 0.3)",
      },
      borderRadius: {
        card: "20px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
