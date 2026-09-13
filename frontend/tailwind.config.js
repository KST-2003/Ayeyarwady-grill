/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sampled to match the landing page / dashboard prototypes
        // (Figures 2.4 and 2.5): dark brown surfaces, cream background,
        // warm orange accent.
        cream: "#FAF6EF",
        "grill-brown": {
          DEFAULT: "#3E2A20",
          dark: "#2A1B14",
          light: "#5A3E2D",
        },
        "grill-orange": {
          DEFAULT: "#D9642A",
          dark: "#B54F1F",
          light: "#E88A56",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
