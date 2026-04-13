/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        background: "#0f172a",
        foreground: "#f8fafc",
        muted: "#94a3b8",
      },
      boxShadow: {
        "glow-primary": "0 0 0 1px rgba(37, 99, 235, 0.2), 0 10px 30px rgba(37, 99, 235, 0.25)",
      },
      animation: {
        "slow-spin": "spin 1.2s linear infinite",
      },
    },
  },
  plugins: [],
}
