'use client';
// frontend/app/reinitialiser-mdp/confirmer/page.tsx
//
// CORRECTION : cette page n'existait pas du tout. Le lien envoyé par email
// (services/emailService.js → sendPasswordResetEmail) pointe pourtant vers
// `${FRONTEND_URL}/reinitialiser-mdp/confirmer?token=...&email=...` — sans
// cette page, un utilisateur cliquant sur le lien reçu tombait sur un 404
// et ne pouvait jamais terminer la réinitialisation de son mot de passe.
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

function ConfirmerReinitialisationForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const email = searchParams?.get('email') || '';

  const [form, setForm]       = useState({ nouveauMotDePasse: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [succes, setSucces]   = useState(false);
  const [erreur, setErreur]   = useState('');

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const lienInvalide = !token || !email;

  const handleSubmit = async () => {
    if (!form.nouveauMotDePasse || !form.confirm)
      return setErreur('Tous les champs sont requis.');
    if (form.nouveauMotDePasse.length < 8)
      return setErreur('Le mot de passe doit contenir au moins 8 caractères.');
    if (form.nouveauMotDePasse !== form.confirm)
      return setErreur('Les mots de passe ne correspondent pas.');

    setLoading(true); setErreur('');
    try {
      await authApi.confirmerResetMdp({ email, token, nouveauMotDePasse: form.nouveauMotDePasse });
      setSucces(true);
    } catch (e: any) {
      setErreur(e.message || 'Lien invalide ou expiré. Merci de refaire une demande.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-brand-600">Afrika Influence Hub</h1>
          <p className="text-gray-600 mt-2">Choisissez un nouveau mot de passe</p>
        </div>

        <div className="bg-white rounded-3xl shadow-bento p-8 space-y-4">
          {lienInvalide ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl mx-auto">⚠️</div>
              <p className="text-gray-700">Ce lien de réinitialisation est incomplet ou invalide.</p>
              <Link href="/reinitialiser-mdp" className="btn-primary inline-flex w-full justify-center">
                Refaire une demande
              </Link>
            </div>
          ) : succes ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl mx-auto">✅</div>
              <p className="text-gray-700">Votre mot de passe a été réinitialisé avec succès.</p>
              <Link href="/connexion" className="btn-primary inline-flex w-full justify-center">
                Aller à la connexion
              </Link>
            </div>
          ) : (
            <>
              {erreur && <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{erreur}</div>}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nouveau mot de passe</label>
                <input type="password" value={form.nouveauMotDePasse} onChange={e => setF('nouveauMotDePasse', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="8 caractères minimum" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmer le mot de passe</label>
                <input type="password" value={form.confirm} onChange={e => setF('confirm', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Répétez le mot de passe" />
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3.5 bg-gradient-brand hover:opacity-90 disabled:opacity-60 text-white font-semibold rounded-2xl transition-all shadow-bento hover-lift">
                {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-400 pt-2">
            <Link href="/connexion" className="text-brand-600 hover:underline font-medium">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// useSearchParams() exige un Suspense boundary en build statique Next.js.
export default function ConfirmerReinitialisationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmerReinitialisationForm />
    </Suspense>
  );
}
