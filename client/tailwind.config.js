/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        med: {
          50: "#f4fbff",
          100: "#e7f5ff",
          200: "#cae9fb",
          300: "#9fd9f6",
          500: "#2e9fcc",
          700: "#1c6f95",
          900: "#12394c"
        }
      },
      boxShadow: {
        soft: "0 10px 28px rgba(16, 56, 86, 0.10)"
      },
      borderRadius: {
        xl2: "12px"
      }
    }
  },
  plugins: []
};
