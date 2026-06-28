import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#16a34a",
        "primary-dark": "#15803d",
        "primary-light": "#22c55e",
        dark: "#333333",
        "dark-2": "#262626",
        muted: "#767676",
        "border-color": "#e0e0e0",
        "gray-bg": "#f5f5f5",
        "accent": "#ffdf40",
      },
      fontFamily: {
        sans: ["IRANSansWeb_FaNum", "IRANSansWeb", "Tahoma", "Arial", "sans-serif"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
        },
      },
    },
  },
  plugins: [],
};
export default config;
