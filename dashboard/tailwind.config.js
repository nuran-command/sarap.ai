/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        field: "#f7f5ef",
        mint: "#2e7d6b",
        tomato: "#c84835",
        gold: "#c99732",
      },
    },
  },
  plugins: [],
};
