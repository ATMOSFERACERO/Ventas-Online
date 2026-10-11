/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: { extend: { colors: { brand: { DEFAULT: '#0d9488', dark: '#0f766e' } } } },
  plugins: [],
}
