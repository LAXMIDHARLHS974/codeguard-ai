/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09080D",
        sidebar: "#08070A",
        card: "#17131D",
        cardHover: "#1F1A27",
        panel: "#17131D",
        panel2: "#120E18",
        purple: {
          DEFAULT: "#C78BCB",
          dark: "#9E64A2",
          light: "#E5B4E8",
        },
        pink: {
          DEFAULT: "#F0A4D9",
          dark: "#D87DBE",
          light: "#F7C3E7",
        },
        text: "#FFFFFF",
        secondary: "#AAA5B3",
        muted: "#7E788B",
        line: "rgba(255, 255, 255, 0.07)",
        lineHover: "rgba(199, 139, 203, 0.3)",
        cyan: {
          DEFAULT: "#38bdf8",
          dark: "#0284c7",
        },
        green: {
          DEFAULT: "#34d399",
          dark: "#059669",
        },
        red: {
          DEFAULT: "#f87171",
          dark: "#dc2626",
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
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 35px -5px rgba(199, 139, 203, 0.2)",
        glowPink: "0 0 35px -5px rgba(240, 164, 217, 0.25)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
}
