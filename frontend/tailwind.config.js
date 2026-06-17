/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — deep indigo/violet (sidebar, primary actions)
        brand: {
          50: "#f1efff",
          100: "#e4e0ff",
          200: "#cbc3ff",
          300: "#a99bff",
          400: "#8a76fb",
          500: "#6d5efc",
          600: "#5b4ef0",
          700: "#4a3dcc",
          800: "#3a31a0",
          900: "#1c1640",
        },
        // Accent — Red Hat red, used sparingly
        rh: {
          500: "#ee0000",
          600: "#cc0000",
        },
        ink: {
          950: "#0b0a1f",
          900: "#141235",
          800: "#1d1a47",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "ui-sans-serif", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)",
        soft: "0 2px 8px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.06)",
        lift: "0 12px 32px rgba(43,33,120,.14)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up .4s cubic-bezier(.2,.7,.3,1) both",
        shimmer: "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
};
