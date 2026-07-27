'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function InscriptionCreateurPage() {
  const router = useRouter();
  const { setAuthData } = useAuth();
  const [form, setForm]       = useState({ nom: '', email: '', password: '', confirm: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur]   = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nom || !form.email || !form.password) return setErreur('Tous les champs sont obligatoires.');
    if (form.password.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères.');
    if (form.password !== form.confirm) return setErreur('Les mots de passe ne correspondent pas.');
    if (!acceptTerms) return setErreur('Vous devez accepter les conditions d\'utilisation.');

    setLoading(true); setErreur('');
    try {
      const response = await authApi.inscription({ nom: form.nom, email: form.email, password: form.password, role: 'CREATEUR' });
      // authApi.inscription now returns { token, utilisateur }
      setAuthData(response.token, response.utilisateur);
      router.push('/onboarding/createur');
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de l\'inscription.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 lg:grid-cols-[1fr_minmax(460px,0.9fr)] items-center">
        <div className="rounded-[32px] shadow-soft relative overflow-hidden">
          <img 
            src="/images/createur.jpg" 
            alt="Afrika Influence" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="rounded-[32px] bg-white shadow-bento border border-gray-100 p-10">
          <div className="flex items-center gap-3 mb-8">
           
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Créateur</p>
              <h2 className="text-2xl font-semibold text-gray-900">Créez votre profil</h2>
            </div>
          </div>

          {erreur && <div className="mb-5 p-4 rounded-3xl bg-red-50 border border-red-100 text-sm text-red-700">{erreur}</div>}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom complet</label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)} className="input-base mt-1.5" placeholder="Aminata Diallo" autoFocus />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-base mt-1.5" placeholder="vous@exemple.com" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mot de passe</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-base mt-1.5" placeholder="8 caractères minimum" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmer le mot de passe</label>
                <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="input-base mt-1.5" placeholder="••••••••" />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mt-4">
              <input
                type="checkbox"
<<<<<<< Updated upstream
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
=======
                checked={draft.acceptTerms}
                onChange={e => set('acceptTerms', e.target.checked)}
>>>>>>> Stashed changes
                className="mt-1 h-5 w-5 rounded border-gray-200 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-500 leading-relaxed">
                J'ai lu et j'accepte les{" "}
                <Link href="/conditions-utilisation" className="text-brand-600 hover:underline">Conditions d'utilisation</Link>
                {" "}ainsi que la{" "}
                <Link href="/politique-confidentialite" className="text-brand-600 hover:underline">Politique de confidentialité</Link>.
              </span>
            </label>

            <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3.5 mt-2">
              {loading ? 'Création du compte…' : 'Créer mon compte créateur'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Vous êtes une marque ? <Link href="/inscription/marque" className="text-brand-600 hover:underline">Inscription marque →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
