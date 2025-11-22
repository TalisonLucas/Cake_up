/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cake-pink': '#FFB5A0',
        'cake-cyan': '#B0E0E6',
        'cake-text': '#4A4A4A',
        'cake-dark-pink': '#FF9B85',
      },
      fontFamily: {
        'handwriting': ['Comic Sans MS', 'cursive'],
      },
    },
  },
  plugins: [],
}

