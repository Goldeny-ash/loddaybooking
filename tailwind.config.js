/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inria-serif)", "serif"],
        serif: ["var(--font-inria-serif)", "serif"],
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
