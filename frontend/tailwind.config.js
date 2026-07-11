/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        emerald: {
          50:  '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b',
        },
        violet: { 100: '#ede9fe', 400: '#a78bfa', 700: '#6d28d9' },
        purple: { 50: '#faf5ff', 100: '#f3e8ff', 400: '#c084fc', 700: '#7e22ce' },
        teal:   { 300: '#5eead4' },
      },
      backgroundImage: {
        'gradient-emerald': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        'gradient-hero':    'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f8faff 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #064e3b 0%, #065f46 60%, #047857 100%)',
      },
      boxShadow: {
        bento: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        soft:  '0 12px 40px rgba(0,0,0,0.10)',
        card:  '0 0 0 1px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)',
      },
      borderRadius: { '3xl': '1.5rem' },
    },
  },
  plugins: [],
};
