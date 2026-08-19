/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bloom semantic tokens — README § Design Tokens. Do not scatter hex.
        cream: "#FAF6EC",
        "cream-dim": "#F3EFE2",
        sand: "#EDE6D3",
        "border-soft": "#E8E2CF",
        "border-strong": "#E0D9C6",
        green: "#295C4D",
        "green-deep": "#1D4438",
        charcoal: "#22342C",
        gold: "#C8A951",
        "gold-bright": "#E9B93B",
        "gold-tint": "#FDF9EF",
        "gold-tint-border": "#EAD9A8",
        "gold-chip": "#F4EDDA",
        relating: "#C8A951",
        listening: "#4A8AD0",
        discerning: "#5BAA70",
        "self-emptying": "#8E6FB6",
        safety: "#6E2B2F",
        good: "#5BAA70",
        warn: "#E19A45",
        concern: "#D9634E",
        ink: "#22342C",
        "ink-2": "#5A6156",
        // Metadata darkened from prototype #98917C for WCAG AA on cream
        // (DESIGN_REVIEW.md P1-2).
        meta: "#6F6A58",
        "meta-faint": "#8A8875",
        "on-dark": "#F3EFE2",
        "on-dark-dim": "#BFD3C6",
        "gold-ink": "#8A7A45",
        "nav-idle": "#847D66",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        body: ['"Instrument Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        row: "13px",
        input: "14px",
        shell: "38px",
      },
      boxShadow: {
        shell: "0 18px 50px rgba(34,52,44,.14)",
      },
      keyframes: {
        petal: { from: { transform: "scale(0)" }, to: { transform: "scale(1)" } },
        breathe: {
          "0%,100%": { transform: "scale(1) rotate(0deg)" },
          "50%": { transform: "scale(1.05) rotate(3deg)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        breathe: "breathe 5s ease-in-out infinite",
        fadeUp: "fadeUp .55s ease both",
      },
    },
  },
  plugins: [],
};
