/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Inter var"', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#14b8a6', dark: '#0d9488' },
        secondary: { DEFAULT: '#6366f1', dark: '#4338ca' },
      },
    },
  },
  plugins: [],
};
