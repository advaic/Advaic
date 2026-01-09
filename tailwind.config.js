/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#15444E",
        accent: "#D4AF37",
        muted: "#F9F9FB",
        "text-muted": "#A0AEC0",
        secondary: "#7E5BEF",
        "bg-card": "#E9E5FC",
      },
      boxShadow: {
        advaic: "0 4px 12px rgba(0,0,0,0.15)",
        advaicSm: "0 2px 6px rgba(0,0,0,0.12)",
        advaicLg: "0 6px 18px rgba(0,0,0,0.20)",
      },
    },
  },
  plugins: [],
};
