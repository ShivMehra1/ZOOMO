/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand greens — ported from the zoomo-eats reference design system
        "z-primary": "#0F3D2D",
        "z-hover": "#164A39",
        "z-accent": "#1F7A52",
        // Page / surface backgrounds
        "z-page": "#F4F7F5",
        "z-surface": "#FFFFFF",
        "z-card": "#111111",
        "z-card2": "#0a1a0f",
        // Text + borders
        "z-ink": "#0C1612",
        "z-sub": "#5A6660",
        "z-muted": "#8A938E",
        "z-line": "#DCE6E0",
        "z-line-soft": "#EEF3F0",
        "z-danger": "#B42318",
        "z-sage": "#D7E6DE",
      },
      fontFamily: {
        sans: ["Satoshi", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        zoomo: "1rem",
        card: "1.5rem",
      },
      boxShadow: {
        zoomo: "0 2px 10px rgba(0,0,0,0.04)",
        card: "0 0 0 1px rgba(15,61,45,0.06), 0 1px 2px rgba(15,61,45,0.04), 0 8px 24px rgba(15,61,45,0.05)",
        lift: "0 0 0 1px rgba(15,61,45,0.1), 0 16px 40px rgba(15,61,45,0.12)",
      },
      backgroundImage: {
        "z-gradient": "linear-gradient(135deg, #0F3D2D 0%, #164A39 100%)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-8px)" } },
        wiggle: { "0%,100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        wiggle: "wiggle 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
