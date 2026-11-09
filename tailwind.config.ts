import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        wasl: {
          50: "#fdf3f3",
          100: "#fbe4e4",
          200: "#f8cdcd",
          300: "#f2a9a9",
          400: "#e87878",
          500: "#d94b4b",
          600: "#c02f2f",
          700: "#a12424",
          800: "#862222",
          900: "#702222",
          950: "#3d0f0f",
        },
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b8b8c1",
          400: "#90909e",
          500: "#737383",
          600: "#5c5c6b",
          700: "#4b4b57",
          800: "#40404a",
          900: "#383840",
          950: "#1f1f24",
        },
        ok: {
          50: "#edfcf3",
          100: "#d3f8e0",
          200: "#aaefc5",
          300: "#72e0a2",
          400: "#39c97b",
          500: "#16a95f",
          600: "#0b884c",
          700: "#0b6c3f",
          800: "#0d5634",
          900: "#0c472d",
        },
        warn: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        urdu: [
          "Noto Nastaliq Urdu",
          "Jameel Noori Nastaleeq",
          "Noto Naskh Arabic",
          "Segoe UI",
          "Tahoma",
          "sans-serif",
        ],
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.10)",
        pop: "0 10px 30px rgba(16, 24, 40, 0.14)",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
