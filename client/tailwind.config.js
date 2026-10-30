/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#070816",
        bg2: "#0b0d1d",
        panel: "rgba(18, 21, 43, 0.78)",
        panel2: "#11152b",
        line: "#292d50",
        text: "#f4f5ff",
        muted: "#8d92b0",
        violet: {
          DEFAULT: "#8b5cf6",
          dark: "#7c3aed",
          light: "#c4b5fd",
        },
        cyan: {
          DEFAULT: "#22d3ee",
          dark: "#0891b2",
        },
        green: {
          DEFAULT: "#34d399",
          dark: "#059669",
        },
        red: {
          DEFAULT: "#fb7185",
          dark: "#e11d48",
        },
        orange: {
          DEFAULT: "#fb923c",
          dark: "#ea580c",
        },
        yellow: {
          DEFAULT: "#facc15",
          dark: "#ca8a04",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
