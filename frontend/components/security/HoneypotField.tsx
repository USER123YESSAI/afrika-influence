'use client';

/**
 * Champ piège (honeypot) anti-robots.
 *
 * Invisible et inatteignable pour un utilisateur humain (positionné hors
 * écran, non focusable, exclu de la navigation clavier et des lecteurs
 * d'écran) mais présent dans le DOM et dans le payload du formulaire — un
 * robot qui remplit automatiquement tous les champs d'un <form> le remplira.
 *
 * Le contrôle réel se fait côté backend (middlewares/antiBot.js::honeypot).
 * Ce composant ne fait que transporter la valeur ; ne JAMAIS utiliser
 * display:none ou visibility:hidden seuls, que certains robots savent
 * détecter et ignorer.
 */
export default function HoneypotField({
  name = 'siteInternet',
  value,
  onChange,
}: {
  name?: string;
  value: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-5000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label htmlFor={name}>Site internet</label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
