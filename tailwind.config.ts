import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        pigeon: {
          bg: "#F8F7F4",
          surface: "#FFFFFF",
          primary: "#2D3282",
          accent: "#F97316",
          muted: "#6B7280",
          border: "#E5E7EB",
          success: "#16A34A",
          error: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};
export default config;
