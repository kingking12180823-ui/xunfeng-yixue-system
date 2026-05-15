import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        xf: { navy: "#10203A", navy2: "#18345F", gold: "#BE9B63", mist: "#EEF3FA" }
      },
      boxShadow: { premium: "0 24px 80px rgba(16, 32, 58, 0.14)" }
    }
  },
  plugins: []
};
export default config;
