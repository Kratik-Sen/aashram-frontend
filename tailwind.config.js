/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: "#fff8ed",
          100: "#ffefd1",
          200: "#ffdaa3",
          300: "#ffbf69",
          400: "#ff9e2e",
          500: "#f27e0c",
          600: "#d45f06",
          700: "#b04409",
          800: "#8f3510",
          900: "#762d10"
        },
        ashram: {
          cream: "#fbf5e8",
          leaf: "#2f6f4e",
          charcoal: "#27302d"
        }
      },
      boxShadow: {
        soft: "0 16px 40px rgba(39, 48, 45, 0.08)"
      }
    }
  },
  plugins: []
};
