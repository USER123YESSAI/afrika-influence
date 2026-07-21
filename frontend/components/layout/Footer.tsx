import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-stone-100">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-gray-500">
              La plateforme qui connecte les créateurs de contenu africains aux marques qui veulent leur voix.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-gray-400">Plateforme</p>
              <ul className="space-y-2">
                <li><Link href="/createurs" className="text-gray-700 hover:text-brand-700">Créateurs</Link></li>
                <li><Link href="/entreprises" className="text-gray-700 hover:text-brand-700">Entreprises</Link></li>
                <li><Link href="/#comment-ca-marche" className="text-gray-700 hover:text-brand-700">Comment ça marche</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-gray-400">Compte</p>
              <ul className="space-y-2">
                <li><Link href="/inscription" className="text-gray-700 hover:text-brand-700">Inscription</Link></li>
                <li><Link href="/connexion" className="text-gray-700 hover:text-brand-700">Connexion</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-gray-200 pt-6 text-xs text-gray-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Afrika Influence Hub. Tous droits réservés.</p>
          <p className="font-mono">Fait avec fierté depuis l&apos;Afrique</p>
        </div>
      </div>
    </footer>
  );
}
