'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ConnexionPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur]   = useState('');

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) return setErreur('Email et mot de passe requis.');
    setLoading(true); setErreur('');
    try {
      const user = await login(form.email, form.password);
      if (!user || !user.role) throw new Error('Données utilisateur invalides');

      // Redirection selon le rôle de l'utilisateur
      const redirectMap: Record<string, string> = {
        CREATEUR: '/createur/dashboard',
        ENTREPRISE: '/entreprise/dashboard',
        PARTICULIER: '/entreprise/dashboard',

        ADMINISTRATEUR: '/admin/utilisateurs',
        MODERATEUR: '/moderateur/dashboard',
      };

      const redirectPath = redirectMap[user.role] || '/landing';
      router.push(redirectPath);
    } catch (e: any) {
      setErreur(e.message || 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-8 lg:grid-cols-[1.05fr_minmax(420px,0.95fr)] lg:px-8 lg:py-10">
        <div className="lg:order-2 hidden lg:flex flex-1 items-stretch">
          <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-soft">
            <img 
              src="/images/afrika-content.jpg" 
              alt="Afrika Influence" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay masquant la partie basse "Afrika Nova" */}
            <div className="absolute bottom-0 left-0 w-full h-[45%] bg-brand-900 p-10 flex flex-col justify-end">
              {/* Dégradé de transition vers les photos du haut */}
              <div className="absolute top-0 left-0 w-full h-32 -translate-y-full bg-gradient-to-t from-brand-900 to-transparent"></div>
              
              <div className="relative z-10">
               
                <h2 className="text-3xl font-display text-white leading-tight mb-3">
                  L'Afrique a du talent, <br />
                  <span className="text-brand-300">faites-le rayonner.</span>
                </h2>
                <p className="text-brand-50/90 text-sm leading-relaxed mb-6 max-w-sm">
                  Reprenez le contrôle de vos campagnes et de votre communauté d'influenceurs en un clin d'œil.
                </p>
                
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-0">
          <div className="w-full max-w-sm animate-fade-in">
            <Link href="/landing" className="inline-flex items-center gap-2 text-sm text-fog hover:text-cyan mb-8 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Retour à l'accueil
            </Link>

            <h1 className="font-display text-3xl text-mist mb-2">Connexion</h1>
            <p className="text-fog mb-8">Accédez à votre espace Afrika Influence Hub.</p>

            {erreur && <div className="mb-5 p-3.5 bg-red-400/10 border border-red-400/20 text-red-400 text-sm rounded-xl">{erreur}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-fog uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setF('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="input-base mt-1.5"
                  placeholder="vous@exemple.com"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-fog uppercase tracking-wide">Mot de passe</label>
                  <Link href="/reinitialiser-mdp" className="text-xs text-cyan hover:underline">Mot de passe oublié ?</Link>
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setF('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="input-base mt-1.5"
                  placeholder="••••••••"
                />
              </div>

              <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </div>

            <p className="text-center text-sm text-fog mt-6">
              Pas encore de compte ? <Link href="/inscription" className="text-cyan hover:underline font-medium">S'inscrire</Link>
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-surface-2 border border-hairline rounded-2xl text-xs text-cyan">
                <p className="font-semibold mb-2">🧪 Comptes de test</p>
                {[
                  { label: 'Admin',      email: 'admin@baobab.sn' },
                  { label: 'Modérateur', email: 'moderateur@baobab.sn' },
                  { label: 'Marque',     email: 'marque@baobab.sn' },
                  { label: 'Créateur',   email: 'aminata@baobab.sn' },
                ].map(c => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => setForm({ email: c.email, password: 'password123' })}
                    className="block w-full text-left px-2 py-1 rounded-lg hover:bg-surface transition-colors"
                  >
                    {c.label} — {c.email}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
