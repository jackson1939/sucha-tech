/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg:      '#05050f',
        accent:  '#7c3aed',
        accent2: '#a78bfa',
        surface: '#0f0f1a',
        border:  'rgba(255,255,255,0.08)',
        text1:   '#f0f0ff',
        text2:   '#a0a0c0',
        text3:   '#606080',
        danger:  '#dc2626',
        success: '#16a34a',
      },
    },
  },
};
