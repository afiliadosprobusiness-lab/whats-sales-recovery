import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          925: "#040710"
        }
      },
      boxShadow: {
        glow: "0 20px 45px rgba(15, 23, 42, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
