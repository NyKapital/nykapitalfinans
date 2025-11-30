/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NyKapital Primary - Navy
        primary: {
          50: '#f0f4f8',
          100: '#d9e3ed',
          200: '#b3c7db',
          300: '#8dabc9',
          400: '#678fb7',
          500: '#0a2540', // NyKapital Navy
          600: '#081e33',
          700: '#061626',
          800: '#040f1a',
          900: '#02070d',
        },
        // NyKapital Secondary - Gold
        gold: {
          50: '#faf8f4',
          100: '#f5f0e8',
          200: '#ebe1d1',
          300: '#e1d2ba',
          400: '#d7c3a3',
          500: '#c5a065', // NyKapital Gold
          600: '#9e8051',
          700: '#77603d',
          800: '#4f4028',
          900: '#282014',
        },
        // NyKapital Secondary - Racing Green
        green: {
          50: '#f3f6f5',
          100: '#e6edeb',
          200: '#cddbd7',
          300: '#b4c9c3',
          400: '#9bb7af',
          500: '#1b4030', // Racing Green
          600: '#163326',
          700: '#10261d',
          800: '#0b1a13',
          900: '#050d0a',
        },
        // NyKapital Tertiary - Slate Grey
        slate: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#d1d1d1',
          400: '#c1c1c1',
          500: '#666666', // Slate Grey
          600: '#525252',
          700: '#3d3d3d',
          800: '#292929',
          900: '#141414',
        },
        // Chart colors
        chart: {
          1: '#051c2c',
          2: '#354b5e',
          3: '#657a8c',
          4: '#9ba9b5',
          5: '#c0c9d1',
        },
        // Background - Alabaster
        alabaster: '#f7f7f7',
      },
    },
  },
  plugins: [],
}
