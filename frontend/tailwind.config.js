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
        // ─── Identité "Indigo & Laiton" — palette validée, remplace progressivement emerald ───
        brand: {
          // Indigo — couleur principale (confiance, portefeuille/paiement)
          50: '#EEF1F8', 100: '#DCE1F0', 200: '#B7C0DE', 300: '#8E9BC9',
          400: '#5F6EA3', 500: '#3B4A7D', 600: '#26355F', 700: '#1B2A56',
          800: '#141F42', 900: '#0D1530',
        },
        brass: {
          // Laiton — accent CTA (référence aux poids/bijoux en laiton)
          50: '#FBF3E2', 100: '#F5E4C0', 200: '#EACB86', 300: '#DEB158',
          400: '#D19E3C', 500: '#C08A28', 600: '#A3721F', 700: '#825A19',
          800: '#614213', 900: '#402C0D',
        },
        ember: {
          // Corail brûlé — accent secondaire, réservé aux alertes/notifications
          400: '#F27A62', 500: '#E8583D', 600: '#C8432A', 700: '#9E331F',
        },
        stone: {
          // Fond clair chaud — remplace le blanc/crème par défaut
          50: '#FBFAF7', 100: '#F5F3EE', 200: '#EDE7DD', 300: '#DED5C4',
          400: '#C2B49B', 500: '#A69672',
        },
      },
      backgroundImage: {
        'gradient-emerald': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        'gradient-hero':    'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f8faff 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #064e3b 0%, #065f46 60%, #047857 100%)',
        'gradient-brand':   'linear-gradient(135deg, #26355F 0%, #1B2A56 100%)',
        'gradient-brand-hero':    'linear-gradient(135deg, #EEF1F8 0%, #F5F3EE 50%, #FBFAF7 100%)',
        'gradient-brand-sidebar': 'linear-gradient(180deg, #0D1530 0%, #141F42 60%, #1B2A56 100%)',
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
