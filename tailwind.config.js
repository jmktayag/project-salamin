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
        primary: {
          DEFAULT: 'rgb(13, 148, 136)',
          50: 'rgb(240, 253, 250)',
          100: 'rgb(204, 251, 241)',
          500: 'rgb(13, 148, 136)',
          600: 'rgb(15, 118, 110)',
          700: 'rgb(12, 74, 110)',
          dark: 'rgb(15, 118, 110)',
          light: 'rgb(94, 234, 212)',
        },
        secondary: {
          DEFAULT: 'rgb(30, 64, 175)',
          50: 'rgb(239, 246, 255)',
          100: 'rgb(219, 234, 254)',
          500: 'rgb(30, 64, 175)',
          600: 'rgb(30, 58, 138)',
          dark: 'rgb(30, 58, 138)',
          light: 'rgb(147, 197, 253)',
        },
        accent: {
          DEFAULT: 'rgb(251, 191, 36)',
          dark: 'rgb(245, 158, 11)',
          light: 'rgb(254, 240, 138)',
        },
        success: {
          DEFAULT: 'rgb(34, 197, 94)',
          50: 'rgb(240, 253, 244)',
          500: 'rgb(34, 197, 94)',
          600: 'rgb(22, 163, 74)',
        },
        warning: {
          DEFAULT: 'rgb(217, 119, 6)',
          50: 'rgb(255, 251, 235)',
          500: 'rgb(217, 119, 6)',
          600: 'rgb(180, 83, 9)',
        },
        error: {
          DEFAULT: 'rgb(220, 38, 38)',
          50: 'rgb(254, 242, 242)',
          500: 'rgb(220, 38, 38)',
          600: 'rgb(185, 28, 28)',
        },
        info: {
          DEFAULT: 'rgb(37, 99, 235)',
          50: 'rgb(239, 246, 255)',
          500: 'rgb(37, 99, 235)',
          600: 'rgb(29, 78, 216)',
        },
      },
    },
  },
  plugins: [],
};
