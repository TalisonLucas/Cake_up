/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'mobile': {'max': '1279px'},
      'desktop': {'min': '1280px'},
    },
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



