/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        grand: ["var(--font-grand-hotel)", "cursive"],
        sacramento: ["var(--font-sacramento)", "cursive"],
      },
      colors: {
        blackManga: "#001524",
        seamount: "#15616D",
        delightfulPeach: "#FFECD1",
        amber: "#FF7D00",
        temperedChocolate: "#78290F",
      },
    },
  },
  plugins: [],
};
