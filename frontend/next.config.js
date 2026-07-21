/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next-dev',

  // SECURITE (XSS + clickjacking) : Helmet protège l'API backend, mais le
  // frontend Next.js est un serveur HTTP distinct qui ne recevait jusqu'ici
  // AUCUN en-tête de sécurité. On les ajoute ici, au niveau du serveur qui
  // sert réellement les pages HTML consultées par le navigateur.
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // En développement, Next.js a besoin de unsafe-eval et unsafe-inline pour le hot-reload
    const isDev = process.env.NODE_ENV !== 'production';
    const scriptSrc = isDev 
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" 
      : "script-src 'self'";

    return [
      {
        source: '/:path*',
        headers: [
          // Empêche d'intégrer le site dans une <iframe> tierce (clickjacking).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Empêche le navigateur de deviner un type MIME différent de celui
          // déclaré (protège notamment contre l'exécution de fichiers uploadés
          // comme du HTML/JS si jamais servis avec un mauvais Content-Type).
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // CSP : dernier filet en cas de XSS stocké malgré la sanitization
          // backend — même si un script est injecté dans le DOM, le navigateur
          // refuse de l'exécuter s'il n'est pas servi depuis notre domaine.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: ${apiUrl}`,
              `connect-src 'self' ${apiUrl}`,
              "font-src 'self' data:",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;