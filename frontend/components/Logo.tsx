// components/Logo.tsx
//
// Nouveau logo — remplace l'ancienne image JPG (un simple pictogramme
// générique). Le mark est un SVG vectoriel dessiné pour porter les deux
// idées demandées dans le même symbole :
//   1. L'Afrique : une silhouette stylisée du continent (large au nord,
//      échancrure du Corne à l'est, bulbe du golfe de Guinée à l'ouest,
//      effilée vers le sud) — volontairement une interprétation graphique
//      simplifiée plutôt qu'un tracé cartographique exact, pour rester
//      lisible à petite taille (favicon, barre de navigation).
//   2. La connexion : un petit réseau de nœuds reliés par des lignes,
//      superposé à la silhouette — représente la mise en relation
//      créateurs ↔ entreprises portée par la plateforme. Le nœud central
//      (légèrement plus grand, animé) symbolise la plateforme elle-même.
// Le nom de marque reste toujours affiché à côté du symbole pour lever
// toute ambiguïté d'interprétation.
//
// Un seul fichier à modifier pour changer le logo partout (6 usages dans le
// projet) — aucun autre fichier n'a besoin d'être touché.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 100 115"
        className="h-8 w-auto flex-shrink-0 sm:h-9"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="afrika-mark-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>
        </defs>

        {/* Silhouette du continent */}
        <path
          d="M38,4 Q50,0 58,3 Q68,6 73,10 Q82,14 88,23 Q80,30 76,33
             Q80,42 76,52 Q72,64 68,74 Q64,86 58,96 Q54,104 48,109
             Q44,102 40,96 Q34,90 36,80 Q26,86 24,76 Q18,66 20,56
             Q12,50 9,40 Q8,32 14,28 Q12,20 18,14 Q24,8 32,6 Q35,4 38,4 Z"
          fill="url(#afrika-mark-fill)"
        />

        {/* Réseau de connexions superposé */}
        <g stroke="#ecfeff" strokeWidth="1.1" strokeLinecap="round" opacity="0.85">
          <line x1="24" y1="20" x2="66" y2="13" />
          <line x1="24" y1="20" x2="26" y2="43" />
          <line x1="66" y1="13" x2="64" y2="47" />
          <line x1="26" y1="43" x2="64" y2="47" />
          <line x1="26" y1="43" x2="47" y2="87" />
          <line x1="64" y1="47" x2="47" y2="87" />
        </g>
        <g fill="#ecfeff">
          <circle cx="24" cy="20" r="2.4" />
          <circle cx="66" cy="13" r="2.4" />
          <circle cx="64" cy="47" r="2.4" />
          <circle cx="47" cy="87" r="2.4" />
          {/* Nœud central = la plateforme, légèrement plus marqué */}
          <circle cx="26" cy="43" r="3.4" className="animate-pulse-gentle" />
        </g>
      </svg>

      <span className="font-display leading-none whitespace-nowrap">
        <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">Afrika</span>
        <span className="text-lg sm:text-xl font-light tracking-tight text-fog"> Influence</span>
      </span>
    </div>
  );
}
