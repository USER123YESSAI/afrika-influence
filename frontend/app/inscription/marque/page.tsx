'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

const CATEGORIES = [
  { value: 'PARTICULIER', label: 'Particulier', desc: 'Je gère ma marque personnelle ou mon side-project' },
  { value: 'ENTREPRISE',  label: 'Entreprise'  , desc: 'Je représente une société établie' },
];

export default function InscriptionMarquePage() {
  const [step, setStep]       = useState(1);
  const [categorie, setCat]   = useState<'PARTICULIER' | 'ENTREPRISE' | ''>('');
  const [form, setForm]       = useState({ nom: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur]   = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nom || !form.email || !form.password) return setErreur('Tous les champs sont obligatoires.');
    if (form.password.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères.');
    if (form.password !== form.confirm) return setErreur('Les mots de passe ne correspondent pas.');
    if (!categorie) return setErreur('Veuillez choisir un type de compte.');

    setLoading(true); setErreur('');
    try {
      await authApi.inscription({ nom: form.nom, email: form.email, password: form.password, role: categorie });
      setSuccess(true);
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de l\'inscription.');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md text-center animate-fade-in rounded-[32px] bg-white p-10 shadow-bento border border-gray-100">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto mb-6">✅</div>
        <h1 className="font-display text-2xl text-gray-900 mb-3">Inscription réussie !</h1>
        <p className="text-gray-500 leading-relaxed mb-8">
          Votre compte est créé. Complétez votre profil marque pour lancer vos campagnes et inviter des créateurs.
        </p>
        <Link href="/connexion" className="btn-primary inline-flex w-full justify-center">Aller à la connexion</Link>
      </div>
    </div>
  );

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
          <div className="flex items-center gap-3 mb-8">
           
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Marque</p>
              <h2 className="text-2xl font-semibold text-gray-900">Démarrez avec votre profil</h2>
            </div>
          </div>

          {erreur && <div className="mb-5 p-4 rounded-3xl bg-red-50 border border-red-100 text-sm text-red-700">{erreur}</div>}

          {step === 1 ? (
            <div className="space-y-5">
              <p className="text-gray-500">Sélectionnez votre type de compte :</p>
              <div className="grid gap-3">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" onClick={() => setCat(c.value)}
                    className={`w-full rounded-3xl p-5 text-left border transition-all ${categorie === c.value ? 'border-emerald-500 bg-emerald-50 shadow-bento' : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-soft'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{c.label}</p>
                        <p className="text-sm text-gray-500">{c.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep(2)} disabled={!categorie}
                className="btn-primary w-full py-3.5">
                Continuer
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{categorie === 'PARTICULIER' ? 'Nom complet' : 'Nom de l\'entreprise'}</label>
                  <input value={form.nom} onChange={e => set('nom', e.target.value)} className="input-base mt-1.5" placeholder={categorie === 'PARTICULIER' ? 'Votre nom' : 'Nom de votre marque'} autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-base mt-1.5" placeholder="contact@exemple.com" />
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
              </div>

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
