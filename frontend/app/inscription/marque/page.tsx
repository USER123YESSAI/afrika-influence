'use client';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RetourNav from '@/components/nav/RetourNav';
import HoneypotField from '@/components/security/HoneypotField';
import { useDraftStorage } from '@/lib/useDraftStorage';
import { useState } from 'react';
import { Building2, User } from 'lucide-react';

const CATEGORIES = [
  { value: 'PARTICULIER' as const, label: 'Particulier', desc: 'Je gère ma marque personnelle ou mon side-project', Icon: User },
  { value: 'ENTREPRISE'  as const, label: 'Entreprise'  , desc: 'Je représente une société établie', Icon: Building2 },
];

type DraftMarque = { step: 1 | 2; categorie: '' | 'PARTICULIER' | 'ENTREPRISE'; nom: string; email: string; acceptTerms: boolean };

export default function InscriptionMarquePage() {
  const router = useRouter();
  const { setAuthData } = useAuth();

  // Brouillon persistant (hors mot de passe) — couvre l'étape ET la
  // catégorie choisie, pour que revenir en arrière (ex: relire les
  // conditions) puis revenir en avant reprenne exactement où on en était.
  const [draft, setDraft, effacerDraft] = useDraftStorage<DraftMarque>(
    'inscription-marque-draft',
    { step: 1, categorie: '', nom: '', email: '', acceptTerms: false }
  );
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [siteInternet, setSiteInternet] = useState(''); // champ piège honeypot
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur]   = useState('');

  const set = <K extends keyof DraftMarque>(k: K, v: DraftMarque[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const handleSubmit = async () => {
    if (!draft.nom || !draft.email || !password) return setErreur('Tous les champs sont obligatoires.');
    if (password.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== confirm) return setErreur('Les mots de passe ne correspondent pas.');
    if (!draft.categorie) return setErreur('Veuillez choisir un type de compte.');
    if (!draft.acceptTerms) return setErreur('Vous devez accepter les conditions d\'utilisation.');

    setLoading(true); setErreur('');
    try {
      const response = await authApi.inscription({ nom: draft.nom, email: draft.email, password, role: draft.categorie, siteInternet });
      // CORRECTION NAVIGATION : le flux créateur connecte automatiquement
      // l'utilisateur après inscription et l'envoie sur son espace ; le flux
      // marque le renvoyait se reconnecter manuellement sur /connexion. On
      // aligne les deux pour une navigation cohérente entre les deux parcours.
      setAuthData(response.token, response.utilisateur);
      effacerDraft();
      router.push('/entreprise/dashboard');
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de l\'inscription.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 lg:grid-cols-[1.05fr_minmax(460px,0.95fr)] items-center">
        <div className="rounded-[32px] shadow-soft relative overflow-hidden">
          <img
            src="/images/marque.jpg"
            alt="Afrika Influence"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="rounded-[32px] bg-white shadow-bento border border-gray-100 p-10">
          <RetourNav theme="light" />

          <div className="flex items-center justify-between gap-3 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Marque</p>
              <h2 className="text-2xl font-semibold text-gray-900">Démarrez avec votre profil</h2>
            </div>
            {/* Repère d'étape simple : rassure sur la progression et la cohérence du parcours */}
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-6 rounded-full transition-colors ${draft.step === 1 ? 'bg-emerald-500' : 'bg-emerald-200'}`} />
              <span className={`h-1.5 w-6 rounded-full transition-colors ${draft.step === 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            </div>
          </div>

          {erreur && <div className="mb-5 p-4 rounded-3xl bg-red-50 border border-red-100 text-sm text-red-700">{erreur}</div>}

          <HoneypotField value={siteInternet} onChange={setSiteInternet} />

          {draft.step === 1 ? (
            <div className="space-y-5">
              <p className="text-gray-500">Sélectionnez votre type de compte :</p>
              <div className="grid gap-3">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" onClick={() => set('categorie', c.value)}
                    className={`w-full rounded-3xl p-5 text-left border transition-all ${draft.categorie === c.value ? 'border-emerald-500 bg-emerald-50 shadow-bento' : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-soft'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${draft.categorie === c.value ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <c.Icon size={20} />
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{c.label}</p>
                        <p className="text-sm text-gray-500">{c.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => set('step', 2)} disabled={!draft.categorie}
                className="btn-primary w-full py-3.5">
                Continuer
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <button type="button" onClick={() => set('step', 1)} className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
                ← Changer de type de compte
              </button>
              <div className="grid gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{draft.categorie === 'PARTICULIER' ? 'Nom complet' : 'Nom de l\'entreprise'}</label>
                  <input value={draft.nom} onChange={e => set('nom', e.target.value)} className="input-base mt-1.5" placeholder={draft.categorie === 'PARTICULIER' ? 'Votre nom' : 'Nom de votre marque'} autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <input type="email" value={draft.email} onChange={e => set('email', e.target.value)} className="input-base mt-1.5" placeholder="contact@exemple.com" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mot de passe</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-base mt-1.5" placeholder="8 caractères minimum" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmer le mot de passe</label>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      className="input-base mt-1.5" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={draft.acceptTerms}
                  onChange={e => set('acceptTerms', e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-200 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-500 leading-relaxed">
                  J'ai lu et j'accepte les{" "}
                  <Link href="/conditions-utilisation" className="text-emerald-600 hover:underline">Conditions d'utilisation</Link>
                  {" "}ainsi que la{" "}
                  <Link href="/politique-confidentialite" className="text-emerald-600 hover:underline">Politique de confidentialité</Link>.
                </span>
              </label>

              <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Création du compte…' : 'Créer mon compte'}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Vous êtes créateur ? <Link href="/inscription/createur" className="text-emerald-600 hover:underline">Inscription créateur →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
