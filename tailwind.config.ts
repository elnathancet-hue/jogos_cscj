import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidade visual — dourado/âmbar como destaque
        brand: {
          DEFAULT: "#f59e0b",
          dark: "#0f172a",
        },
      },
      fontFamily: {
        // fonte arredondada/divertida usada na experiência de jogar (/play)
        display: ["var(--font-fredoka)", "system-ui", "sans-serif"],
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        "pulse-correct": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0)" },
          "50%": { boxShadow: "0 0 0 4px rgba(16,185,129,0.4)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        pop: "pop 0.3s ease-in-out",
        "pulse-correct": "pulse-correct 0.6s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
