export function Logo({
  className = '',
  variant = 'dark',
}: {
  className?: string;
  variant?: 'dark' | 'light';
}) {
  // `text-white` est redéfini dans tailwind.config.js pour suivre le thème
  // (voir --c-surface) — inutilisable pour un fond volontairement toujours
  // sombre (sidebar). On passe donc par du blanc littéral, comme le reste
  // du chrome sombre de l'app (voir .sidebar-link dans globals.css).
  const texteFort = variant === 'light' ? 'text-[#ffffff]' : 'text-gray-900';
  const texteDoux = variant === 'light' ? 'text-[rgba(255,255,255,0.7)]' : 'text-fog';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 100 115"
        className="h-8 w-auto flex-shrink-0 sm:h-9"
        aria-hidden="true"
      >
        <defs>
          {/* Palette "Indigo & Laiton" : mark en dégradé indigo, réseau en
              laiton — remplace l'ancien dégradé cyan pour suivre la nouvelle
              identité visuelle reprise du zip afrika-influence-aminata. */}
          <linearGradient id="afrika-mark-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5F6EA3" />
            <stop offset="100%" stopColor="#1B2A56" />
          </linearGradient>
        </defs>

        <path
          d="M38,4 Q50,0 58,3 Q68,6 73,10 Q82,14 88,23 Q80,30 76,33
             Q80,42 76,52 Q72,64 68,74 Q64,86 58,96 Q54,104 48,109
             Q44,102 40,96 Q34,90 36,80 Q26,86 24,76 Q18,66 20,56
             Q12,50 9,40 Q8,32 14,28 Q12,20 18,14 Q24,8 32,6 Q35,4 38,4 Z"
          fill="url(#afrika-mark-fill)"
        />

        <g stroke="#EACB86" strokeWidth="1.1" strokeLinecap="round" opacity="0.85">
          <line x1="24" y1="20" x2="66" y2="13" />
          <line x1="24" y1="20" x2="26" y2="43" />
          <line x1="66" y1="13" x2="64" y2="47" />
          <line x1="26" y1="43" x2="64" y2="47" />
          <line x1="26" y1="43" x2="47" y2="87" />
          <line x1="64" y1="47" x2="47" y2="87" />
        </g>
        <g fill="#EACB86">
          <circle cx="24" cy="20" r="2.4" />
          <circle cx="66" cy="13" r="2.4" />
          <circle cx="64" cy="47" r="2.4" />
          <circle cx="47" cy="87" r="2.4" />
          <circle cx="26" cy="43" r="3.4" className="animate-pulse-gentle" />
        </g>
      </svg>

      <span className="font-display leading-none whitespace-nowrap">
        <span className={`text-lg sm:text-xl font-bold tracking-tight ${texteFort}`}>Afrika</span>
        <span className={`text-lg sm:text-xl font-light tracking-tight ${texteDoux}`}> Influence</span>
      </span>
    </div>
  );
}