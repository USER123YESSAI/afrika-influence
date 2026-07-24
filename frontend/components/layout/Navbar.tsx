"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, User as UserIcon, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/api";

const LIENS = [
  { href: "/createurs", label: "Créateurs" },
  { href: "/entreprises", label: "Entreprises" },
  { href: "/#avantages", label: "Avantages" },
];

export function Navbar() {
  const [ouvert, setOuvert] = useState(false);
  const [dropdownOuvert, setDropdownOuvert] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOuvert(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDashboardLink = () => {
    if (!user) return "/connexion";
    switch (user.role) {
      case "CREATEUR": return "/createur/dashboard";
      case "ENTREPRISE":
      case "PARTICULIER": return "/entreprise/dashboard";
      case "ADMINISTRATEUR": return "/admin/utilisateurs";
      case "MODERATEUR": return "/moderateur/dashboard";
      default: return "/dashboard";
    }
  };

  const getProfileLink = () => {
    if (!user) return "/connexion";
    switch (user.role) {
      case "CREATEUR": return "/createur/profil";
      case "ENTREPRISE":
      case "PARTICULIER": return "/entreprise/profil";
      default: return "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="Accueil Afrika Influence Hub">
          <Logo />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LIENS.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="text-sm text-fog transition-colors hover:text-mist"
            >
              {lien.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {!user ? (
            <>
              <Link
                href="/connexion"
                className="text-sm text-fog transition-colors hover:text-mist"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-gradient-to-r from-cyan to-emerald px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                Rejoindre la plateforme
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOuvert(!dropdownOuvert)}
                className="flex items-center gap-2 rounded-full border border-hairline bg-surface/50 pl-2 pr-4 py-1.5 transition-colors hover:bg-surface"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-cyan to-emerald text-xs font-bold text-ink overflow-hidden">
                  {user?.photoProfil || user?.logo || user?.photo ? (
                    <img src={getImageUrl(user.photoProfil || user.logo || user.photo)} alt={user.nom} className="w-full h-full object-cover" />
                  ) : (
                    user.nom?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <span className="text-sm font-medium text-mist">{user.nom}</span>
              </button>

              {dropdownOuvert && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-hairline bg-surface-2 shadow-xl animate-fade-in">
                  <Link
                    href={getDashboardLink()}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-fog hover:bg-surface hover:text-mist"
                    onClick={() => setDropdownOuvert(false)}
                  >
                    <LayoutDashboard size={16} />
                    Mon espace
                  </Link>
                  <Link
                    href={getProfileLink()}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-fog hover:bg-surface hover:text-mist"
                    onClick={() => setDropdownOuvert(false)}
                  >
                    <UserIcon size={16} />
                    Mon profil
                  </Link>
                  <div className="h-px bg-hairline" />
                  <button
                    onClick={() => {
                      setDropdownOuvert(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-surface hover:text-red-300"
                  >
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setOuvert(!ouvert)}
          className="text-mist md:hidden"
          aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {ouvert ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {ouvert && (
        <div className="border-t border-hairline bg-ink px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {LIENS.map((lien) => (
              <Link key={lien.href} href={lien.href} className="text-sm text-fog" onClick={() => setOuvert(false)}>
                {lien.label}
              </Link>
            ))}
            <hr className="border-hairline" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-fog">Apparence</span>
              <ThemeToggle />
            </div>
            <hr className="border-hairline" />
            {!user ? (
              <>
                <Link href="/connexion" className="text-sm text-fog" onClick={() => setOuvert(false)}>Connexion</Link>
                <Link
                  href="/inscription"
                  className="rounded-full bg-gradient-to-r from-cyan to-emerald px-4 py-2 text-center text-sm font-medium text-ink"
                  onClick={() => setOuvert(false)}
                >
                  Rejoindre la plateforme
                </Link>
              </>
            ) : (
              <>
                <Link href={getDashboardLink()} className="flex items-center gap-2 text-sm text-fog" onClick={() => setOuvert(false)}>
                  <LayoutDashboard size={16} /> Mon espace
                </Link>
                <Link href={getProfileLink()} className="flex items-center gap-2 text-sm text-fog" onClick={() => setOuvert(false)}>
                  <UserIcon size={16} /> Mon profil
                </Link>
                <button
                  onClick={() => { setOuvert(false); logout(); }}
                  className="flex items-center gap-2 text-left text-sm text-red-400"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}