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
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
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
