/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './frontend/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#7c3aed',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
