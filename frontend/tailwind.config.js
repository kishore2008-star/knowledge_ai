/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#030712", // ultra dark slate
        foreground: "#f3f4f6",
        card: {
          DEFAULT: "rgba(17, 24, 39, 0.7)",
          foreground: "#f3f4f6",
          border: "rgba(255, 255, 255, 0.08)",
        },
        brand: {
          blue: {
            light: "#60a5fa",
            DEFAULT: "#3b82f6",
            dark: "#1d4ed8",
          },
          purple: {
            light: "#c084fc",
            DEFAULT: "#a855f7",
            dark: "#7e22ce",
          }
        }
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-inset": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      }
    },
  },
  plugins: [],
}
