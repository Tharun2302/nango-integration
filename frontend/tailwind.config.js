/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0f0f23',
        surface: '#1a1a2e',
        'surface-light': '#252547',
        accent: '#6366f1',
        'accent-light': '#818cf8',
        border: '#2d2d5e',
      },
    },
  },
  plugins: [],
};
