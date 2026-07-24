/** @type {import('tailwindcss').Config} */
//
// REFONTE DESIGN (couleurs + arrière-plan) — juillet 2026.
//
// Stratégie volontairement choisie pour ce changement : au lieu de modifier
// les classNames dans les ~90 fichiers du frontend (ce qui aurait généré des
// conflits de merge avec toute l'équipe sur quasiment chaque page), on
// redéfinit ici ce que les tokens de couleur DÉSIGNENT, via des variables CSS
// (voir app/globals.css). Un `bg-gray-50` ou un `text-emerald-600` existant
// continue de s'utiliser exactement pareil dans le code — c'est sa valeur
// réelle qui change, et qui peut varier entre mode sombre (par défaut) et
// mode clair sans aucune classe supplémentaire à ajouter.
//
// Conséquences pratiques :
//  - `gray-*` est inversé entre les deux modes (gray-50 = fond de page,
//    gray-900 = texte principal ; en clair c'est la lecture standard
//    Tailwind, en sombre c'est l'inverse — ça matche exactement l'usage déjà
//    fait dans tout le code : bg-gray-50 pour un fond de section, text-gray-900
//    pour un texte lisible).
//  - `emerald-*` ET `cyan-*` pointent vers la MÊME famille de teintes
//    (cyan) : la marque n'a plus qu'un seul accent, mais aucune des deux
//    anciennes conventions utilisées dans le code n'a besoin d'être changée.
//  - `white`/`black` sont également redéfinis (jamais de blanc pur / noir
//    pur, comme demandé) sur les tokens `surface`/`text`.
//  - `ink`, `surface`, `surface-2`, `hairline`, `fog`, `mist` : les tokens
//    sémantiques déjà utilisés dans les pages les plus récentes du projet
//    (Navbar, Sidebar, landing, dashboards...) sont désormais correctement
//    définis (ils ne l'étaient pas encore, ce qui les rendait invisibles).
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'DM Serif Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      colors: {
        // ── Tokens sémantiques (déjà utilisés par une partie du code) ──────
        ink:        'rgb(var(--c-ink) / <alpha-value>)',
        surface:    'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        hairline:   'rgb(var(--c-hairline) / <alpha-value>)',
        fog:        'rgb(var(--c-fog) / <alpha-value>)',
        mist:       'rgb(var(--c-mist) / <alpha-value>)',

        // ── white / black : jamais de valeur pure, toujours liées au thème ─
        white: 'rgb(var(--c-surface) / <alpha-value>)',
        black: 'rgb(var(--c-text) / <alpha-value>)',

        // ── gray : inversé entre les deux modes (voir globals.css) ─────────
        gray: {
          50:  'rgb(var(--c-gray-50)  / <alpha-value>)',
          100: 'rgb(var(--c-gray-100) / <alpha-value>)',
          200: 'rgb(var(--c-gray-200) / <alpha-value>)',
          300: 'rgb(var(--c-gray-300) / <alpha-value>)',
          400: 'rgb(var(--c-gray-400) / <alpha-value>)',
          500: 'rgb(var(--c-gray-500) / <alpha-value>)',
          600: 'rgb(var(--c-gray-600) / <alpha-value>)',
          700: 'rgb(var(--c-gray-700) / <alpha-value>)',
          800: 'rgb(var(--c-gray-800) / <alpha-value>)',
          900: 'rgb(var(--c-gray-900) / <alpha-value>)',
        },

        // ── accent unique (cyan) exposé sous les deux anciens noms ─────────
        cyan: {
          DEFAULT: 'rgb(var(--c-accent-500) / <alpha-value>)',
          50:  'rgb(var(--c-accent-50)  / <alpha-value>)',
          100: 'rgb(var(--c-accent-100) / <alpha-value>)',
          200: 'rgb(var(--c-accent-200) / <alpha-value>)',
          300: 'rgb(var(--c-accent-300) / <alpha-value>)',
          400: 'rgb(var(--c-accent-400) / <alpha-value>)',
          500: 'rgb(var(--c-accent-500) / <alpha-value>)',
          600: 'rgb(var(--c-accent-600) / <alpha-value>)',
          700: 'rgb(var(--c-accent-700) / <alpha-value>)',
          800: 'rgb(var(--c-accent-800) / <alpha-value>)',
          900: 'rgb(var(--c-accent-900) / <alpha-value>)',
        },
        emerald: {
          DEFAULT: 'rgb(var(--c-accent-500) / <alpha-value>)',
          50:  'rgb(var(--c-accent-50)  / <alpha-value>)',
          100: 'rgb(var(--c-accent-100) / <alpha-value>)',
          200: 'rgb(var(--c-accent-200) / <alpha-value>)',
          300: 'rgb(var(--c-accent-300) / <alpha-value>)',
          400: 'rgb(var(--c-accent-400) / <alpha-value>)',
          500: 'rgb(var(--c-accent-500) / <alpha-value>)',
          600: 'rgb(var(--c-accent-600) / <alpha-value>)',
          700: 'rgb(var(--c-accent-700) / <alpha-value>)',
          800: 'rgb(var(--c-accent-800) / <alpha-value>)',
          900: 'rgb(var(--c-accent-900) / <alpha-value>)',
        },

        // Accents secondaires ponctuels (badges), laissés tels quels — ils
        // restent lisibles sur le nouveau fond sombre comme sur le clair.
        violet: { 100: '#ede9fe', 400: '#a78bfa', 700: '#6d28d9' },
        purple: { 50: '#faf5ff', 100: '#f3e8ff', 400: '#c084fc', 700: '#7e22ce' },
        teal:   { 300: '#5eead4' },
      },
      backgroundImage: {
        'gradient-emerald': 'linear-gradient(135deg, rgb(var(--c-accent-600)) 0%, rgb(var(--c-accent-700)) 100%)',
        'gradient-hero':    'linear-gradient(135deg, rgb(var(--c-ink)) 0%, rgb(var(--c-surface-2)) 50%, rgb(var(--c-ink)) 100%)',
        // gradient-sidebar : volontairement PAS lié aux variables de thème
        // (--c-ink/--c-surface changent entre clair/sombre) — Sidebar.tsx
        // superpose du texte en `text-white`/`bg-white/10` en dur sur ce
        // gradient, en partant du principe qu'il reste sombre en permanence
        // (comme la sidebar de la plupart des back-offices). --c-sidebar-*
        // n'est défini qu'une fois dans :root et jamais redéfini pour le
        // mode clair, donc il ne bouge pas quand on bascule le thème.
        'gradient-sidebar': 'linear-gradient(180deg, rgb(var(--c-sidebar-1)) 0%, rgb(var(--c-sidebar-2)) 60%, rgb(var(--c-sidebar-3)) 100%)',
        'gradient-card':    'linear-gradient(135deg, rgb(var(--c-surface)) 0%, rgb(var(--c-surface-2)) 100%)',
      },
      boxShadow: {
        bento: '0 1px 3px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.20)',
        soft:  '0 12px 40px rgba(0,0,0,0.28)',
        card:  '0 0 0 1px rgb(var(--c-hairline)), 0 4px 24px rgba(0,0,0,0.20)',
      },
      borderRadius: { '3xl': '1.5rem' },
    },
  },
  plugins: [],
};
