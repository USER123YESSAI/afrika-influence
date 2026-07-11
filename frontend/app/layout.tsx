import type { Metadata } from 'next';
import { Inter, Outfit, Fira_Code } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ToastProvider from '@/components/ui/Toast';
import { GlobalAppLayout } from '@/components/layout/GlobalAppLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export const metadata: Metadata = {
  title: 'Afrika Influence Hub',
  description: 'La plateforme de référence pour l\'influence en Afrique',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} ${firaCode.variable} font-sans antialiased bg-ink text-fog selection:bg-cyan/30 selection:text-cyan`}>
        <AuthProvider>
          <GlobalAppLayout>
            <ToastProvider>
              {children}
            </ToastProvider>
          </GlobalAppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
