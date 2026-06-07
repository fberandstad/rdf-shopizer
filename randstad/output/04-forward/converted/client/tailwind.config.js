/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        randstad: {
          blue: '#0053A5',
          lblue: '#0084FF',
          cyan: '#00D7FF',
          dark: '#001E50',
          gray1: '#6B7DA0',
          gray2: '#7D8599',
          gray3: '#BCC2D0',
        }
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
