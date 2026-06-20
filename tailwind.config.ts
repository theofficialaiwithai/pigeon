import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Helvetica Neue", "sans-serif"],
        heading: ["var(--font-display)", "Georgia", "serif"],
        accent: ["var(--font-accent)", "Georgia", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        pigeon: {
          ink: "#1A1612",
          "ink-muted": "#5C4F44",
          "ink-faint": "#9C8D82",
          cream: "#FAF7F2",
          parchment: "#F0EBE1",
          "warm-rule": "#E2D9CD",
          sienna: "#C85C2A",
          "sienna-lt": "#F0E0D5",
          sage: "#5A7A5F",
          "sage-lt": "#DCE8DC",
          gold: "#B8870A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
