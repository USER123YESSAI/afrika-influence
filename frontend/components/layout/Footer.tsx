import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-fog">
              La plateforme qui connecte les créateurs de contenu africains aux marques qui veulent leur voix.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-fog">Plateforme</p>
              <ul className="space-y-2">
                <li><Link href="/createurs" className="text-mist hover:text-cyan">Créateurs</Link></li>
                <li><Link href="/entreprises" className="text-mist hover:text-cyan">Entreprises</Link></li>
                <li><Link href="/#avantages" className="text-mist hover:text-cyan">Avantages</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-fog">Compte</p>
              <ul className="space-y-2">
                <li><Link href="/inscription" className="text-mist hover:text-cyan">Inscription</Link></li>
                <li><Link href="/connexion" className="text-mist hover:text-cyan">Connexion</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-hairline pt-6 text-xs text-fog sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Afrika Influence Hub. Tous droits réservés.</p>
          <p className="font-mono">Fait avec fierté depuis l&apos;Afrique</p>
        </div>
      </div>
    </footer>
  );
}