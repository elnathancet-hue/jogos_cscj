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
    },
  },
  plugins: [],
};

export default config;
