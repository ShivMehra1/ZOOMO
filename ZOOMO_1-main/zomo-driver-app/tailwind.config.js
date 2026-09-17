/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        "z-primary": "#0F3D2D",
        "z-hover": "#164A39",
        "z-accent": "#1F7A52",
        "z-page": "#F4F7F5",
        "z-surface": "#FFFFFF",
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
        poppins: ["Satoshi", "sans-serif"],
      },
      borderRadius: {
        card: "1.5rem",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(15,61,45,0.06), 0 1px 2px rgba(15,61,45,0.04), 0 8px 24px rgba(15,61,45,0.05)",
        // Subtle "selected" glow — soft, low-opacity primary-color halo, not a hard border or bright fill.
        glow: "0 0 0 3px rgba(15,61,45,0.10), 0 4px 16px rgba(15,61,45,0.16)",
      },
    },
  },
  plugins: [],
};
