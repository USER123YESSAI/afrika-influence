import type { Metadata } from 'next';
import { Inter, Outfit, Fira_Code } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ToastProvider from '@/components/ui/Toast';
import { GlobalAppLayout } from '@/components/layout/GlobalAppLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export const metadata: Metadata = {
  title: 'Afrika Influence Hub',
  description: 'La plateforme de référence pour l\'influence en Afrique',
};

// Applique le bon data-theme sur <html> AVANT l'hydratation React, pour
// éviter un flash visible (ex : sombre par défaut puis bascule vers le
// dernier choix "clair" de l'utilisateur une fraction de seconde après le
// premier rendu). Le thème sombre reste la valeur par défaut si rien n'est
// stocké — c'est la base demandée pour la plateforme.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stocke = localStorage.getItem('afrika-theme');
    var theme = stocke === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${firaCode.variable} font-sans antialiased bg-ink text-fog selection:bg-cyan/30 selection:text-cyan`}>
        <ThemeProvider>
          <AuthProvider>
            <GlobalAppLayout>
              <ToastProvider>
                {children}
              </ToastProvider>
            </GlobalAppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
